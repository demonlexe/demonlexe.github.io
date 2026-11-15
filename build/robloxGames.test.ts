import { describe, expect, it, vi } from 'vitest'
import { GAMES_SNAPSHOT_FILENAME, fetchGamesSnapshot } from './robloxGames.ts'

function json(body: unknown) {
  return new Response(JSON.stringify(body))
}

function api(url: URL): Response {
  if (url.hostname === 'apis.roblox.com') return json({ universeId: 2001 })
  if (url.pathname === '/v1/games') {
    return json({ data: [{ id: 2001, name: 'Game', playing: 5, visits: 900 }] })
  }
  if (url.pathname === '/v1/games/multiget/thumbnails') {
    return json({
      data: [{ universeId: 2001, thumbnails: [{ state: 'Completed', imageUrl: 'https://img/t' }] }],
    })
  }
  throw new Error(`unexpected ${url}`)
}

describe('fetchGamesSnapshot', () => {
  it('queries Roblox directly (no proxy) and returns a record keyed by place id', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (input) => api(new URL(String(input))))

    const snapshot = await fetchGamesSnapshot([1001], fetchImpl)

    expect(snapshot).toEqual({
      1001: {
        placeId: 1001,
        universeId: 2001,
        name: 'Game',
        playing: 5,
        visits: 900,
        imageUrl: 'https://img/t',
      },
    })
    for (const [input] of fetchImpl.mock.calls) {
      expect(new URL(String(input)).hostname).toMatch(/\.roblox\.com$/)
    }
  })

  it('returns an empty snapshot instead of throwing when Roblox is unreachable', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response('no', { status: 400 }))

    await expect(fetchGamesSnapshot([1001], fetchImpl)).resolves.toEqual({})
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('exposes the asset filename the runtime fetches', () => {
    expect(GAMES_SNAPSHOT_FILENAME).toBe('games.json')
  })
})
