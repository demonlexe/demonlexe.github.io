import { describe, expect, it, vi } from 'vitest'
import { fetchGames, gameUrl, type FetchGamesOptions } from './gameInfo.ts'

const HOSTS = ['https://{service}.a.test', 'https://{service}.b.test'] as const
const UNIVERSES: Record<number, number> = { 1001: 2001, 1002: 2002 }
const THUMB = (u: number) => `https://tr.rbxcdn.com/thumb/${u}.png`
const ICON = (u: number) => `https://tr.rbxcdn.com/icon/${u}.png`

function json(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), init)
}

function ids(url: URL) {
  return (url.searchParams.get('universeIds') ?? '').split(',').map(Number)
}

/** Default happy-path responses; individual tests override per-service. */
function happyPath(url: URL): Response {
  const service = url.hostname.split('.')[0]
  if (service === 'apis') {
    const placeId = Number(url.pathname.split('/')[4])
    return json({ universeId: UNIVERSES[placeId] })
  }
  if (url.pathname === '/v1/games') {
    return json({
      data: ids(url).map((id) => ({ id, name: `Game ${id}`, playing: id % 100, visits: id * 1000 })),
    })
  }
  if (url.pathname === '/v1/games/multiget/thumbnails') {
    return json({
      data: ids(url).map((universeId) => ({
        universeId,
        thumbnails: [{ state: 'Completed', imageUrl: THUMB(universeId) }],
      })),
    })
  }
  if (url.pathname === '/v1/games/icons') {
    return json({
      data: ids(url).map((targetId) => ({ targetId, state: 'Completed', imageUrl: ICON(targetId) })),
    })
  }
  throw new Error(`unexpected ${url}`)
}

function setup(handler: (url: URL, call: number) => Response | Promise<Response> = happyPath) {
  let call = 0
  const fetchImpl = vi.fn<typeof fetch>(async (input) => handler(new URL(String(input)), call++))
  const sleep = vi.fn(async (_ms: number) => {})
  const opts: FetchGamesOptions = { hosts: HOSTS, fetchImpl, sleep, maxAttempts: 4 }
  const urls = () => fetchImpl.mock.calls.map(([input]) => new URL(String(input)))
  return { opts, fetchImpl, sleep, urls }
}

describe('gameUrl', () => {
  it('links to the game page on roblox.com', () => {
    expect(gameUrl(1001)).toBe('https://www.roblox.com/games/1001')
  })
})

describe('fetchGames', () => {
  it('batches details and thumbnails into one request each for all games', async () => {
    const { opts, urls } = setup()

    const result = await fetchGames([1001, 1002], opts)

    expect(result.get(1001)).toEqual({
      placeId: 1001,
      universeId: 2001,
      name: 'Game 2001',
      playing: 1,
      visits: 2001000,
      imageUrl: THUMB(2001),
    })
    expect(result.get(1002)?.name).toBe('Game 2002')

    const all = urls()
    expect(all.filter((u) => u.hostname.startsWith('apis.'))).toHaveLength(2)
    const details = all.filter((u) => u.pathname === '/v1/games')
    expect(details).toHaveLength(1)
    expect(ids(details[0])).toEqual([2001, 2002])
    expect(all.filter((u) => u.pathname === '/v1/games/multiget/thumbnails')).toHaveLength(1)
    expect(all.filter((u) => u.pathname === '/v1/games/icons')).toHaveLength(0)
  })

  it('skips universe lookups and image requests for games it already knows', async () => {
    const { opts, urls } = setup()

    const result = await fetchGames([1001, 1002], {
      ...opts,
      known: {
        1001: { universeId: 2001, imageUrl: 'https://img/1' },
        1002: { universeId: 2002, imageUrl: null },
      },
    })

    expect(result.get(1001)?.imageUrl).toBe('https://img/1')
    // 1002 has no known image, so only it is requested.
    const all = urls()
    expect(all.some((u) => u.hostname.startsWith('apis.'))).toBe(false)
    expect(all.filter((u) => u.pathname === '/v1/games')).toHaveLength(1)
    const thumbs = all.filter((u) => u.pathname === '/v1/games/multiget/thumbnails')
    expect(thumbs.map(ids)).toEqual([[2002]])
  })

  it('makes a single request when everything is already known', async () => {
    const { opts, fetchImpl } = setup()

    await fetchGames([1001], {
      ...opts,
      known: { 1001: { universeId: 2001, imageUrl: 'https://img/1' } },
    })

    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('falls back to the icon for games with no completed thumbnail', async () => {
    const { opts } = setup((url) =>
      url.pathname === '/v1/games/multiget/thumbnails'
        ? json({ data: [{ universeId: 2001, thumbnails: [] }] })
        : happyPath(url),
    )

    const result = await fetchGames([1001], opts)

    expect(result.get(1001)?.imageUrl).toBe(ICON(2001))
  })

  it('returns a null image when neither thumbnail nor icon is available', async () => {
    const { opts } = setup((url) => {
      if (url.pathname === '/v1/games/multiget/thumbnails') return json({ data: [] })
      if (url.pathname === '/v1/games/icons') {
        return json({ data: [{ targetId: 2001, state: 'Blocked', imageUrl: '' }] })
      }
      return happyPath(url)
    })

    const result = await fetchGames([1001], opts)

    expect(result.get(1001)?.imageUrl).toBeNull()
  })

  it('still returns details when image requests fail', async () => {
    const { opts } = setup((url) =>
      url.pathname.startsWith('/v1/games/') ? new Response('x', { status: 400 }) : happyPath(url),
    )

    const result = await fetchGames([1001], opts)

    expect(result.get(1001)?.name).toBe('Game 2001')
    expect(result.get(1001)?.imageUrl).toBeNull()
  })

  it('omits games the API does not return', async () => {
    const { opts } = setup((url) =>
      url.pathname === '/v1/games' ? json({ data: [] }) : happyPath(url),
    )

    const result = await fetchGames([1001], opts)

    expect(result.has(1001)).toBe(false)
  })
})

describe('fetchGames retry behaviour', () => {
  it('fails over to the next host immediately on a 429', async () => {
    const { opts, urls, sleep } = setup((url) =>
      url.hostname === 'games.a.test' ? new Response('slow down', { status: 429 }) : happyPath(url),
    )

    const result = await fetchGames([1001], opts)

    expect(result.get(1001)?.name).toBe('Game 2001')
    const detailHosts = urls()
      .filter((u) => u.pathname === '/v1/games')
      .map((u) => u.hostname)
    expect(detailHosts).toEqual(['games.a.test', 'games.b.test'])
    expect(sleep).not.toHaveBeenCalled()
  })

  it('waits (honouring a capped retry-after) once every host has been tried', async () => {
    let failures = 2
    const { opts, sleep } = setup((url) => {
      if (url.pathname === '/v1/games' && failures-- > 0) {
        return new Response('slow', { status: 429, headers: { 'retry-after': '48' } })
      }
      return happyPath(url)
    })

    const result = await fetchGames([1001], opts)

    expect(result.get(1001)?.name).toBe('Game 2001')
    expect(sleep).toHaveBeenCalledTimes(1)
    expect(sleep).toHaveBeenCalledWith(3000)
  })

  it('uses exponential backoff when there is no retry-after header', async () => {
    let failures = 2
    const { opts, sleep } = setup((url) =>
      url.pathname === '/v1/games' && failures-- > 0
        ? new Response('oops', { status: 503 })
        : happyPath(url),
    )

    await fetchGames([1001], opts)

    expect(sleep).toHaveBeenCalledTimes(1)
    const [delay] = sleep.mock.calls[0]
    expect(delay).toBeGreaterThan(0)
    expect(delay).toBeLessThanOrEqual(3000)
  })

  it('retries after a network error', async () => {
    let failed = false
    const { opts } = setup((url) => {
      if (url.pathname === '/v1/games' && !failed) {
        failed = true
        throw new TypeError('Failed to fetch')
      }
      return happyPath(url)
    })

    const result = await fetchGames([1001], opts)

    expect(result.get(1001)?.name).toBe('Game 2001')
  })

  it('does not retry client errors other than 429', async () => {
    const { opts, urls } = setup((url) =>
      url.pathname === '/v1/games' ? new Response('bad', { status: 400 }) : happyPath(url),
    )

    await expect(fetchGames([1001], opts)).rejects.toThrow(/400/)
    expect(urls().filter((u) => u.pathname === '/v1/games')).toHaveLength(1)
  })

  it('gives up after maxAttempts and reports the last status', async () => {
    const { opts, urls } = setup((url) =>
      url.pathname === '/v1/games' ? new Response('slow', { status: 429 }) : happyPath(url),
    )

    await expect(fetchGames([1001], opts)).rejects.toThrow(/429/)
    expect(urls().filter((u) => u.pathname === '/v1/games')).toHaveLength(4)
  })

  it('retries the universe lookup too', async () => {
    let failed = false
    const { opts } = setup((url) => {
      if (url.hostname.startsWith('apis.') && !failed) {
        failed = true
        return new Response('slow', { status: 429 })
      }
      return happyPath(url)
    })

    const result = await fetchGames([1001], opts)

    expect(result.get(1001)?.universeId).toBe(2001)
  })
})
