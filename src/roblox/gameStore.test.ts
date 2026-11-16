import { describe, expect, it, vi } from 'vitest'
import type { GameInfo } from './gameInfo.ts'
import { createGameStore, type GameStoreDeps } from './gameStore.ts'

function game(placeId: number, overrides: Partial<GameInfo> = {}): GameInfo {
  return {
    placeId,
    universeId: placeId + 1000,
    name: `Game ${placeId}`,
    playing: 10,
    visits: 500,
    imageUrl: `https://img/${placeId}`,
    ...overrides,
  }
}

function memoryStorage(): Storage {
  const data = new Map<string, string>()
  return {
    get length() {
      return data.size
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, v),
  }
}

function setup(overrides: Partial<GameStoreDeps> = {}) {
  let clock = 1_000_000
  const fetchLive = vi.fn<GameStoreDeps['fetchLive']>(async (placeIds) => {
    return new Map(placeIds.map((id) => [id, game(id, { playing: 99 })]))
  })
  const fetchSnapshot = vi.fn<GameStoreDeps['fetchSnapshot']>(async () => ({
    1: game(1, { playing: 1 }),
  }))
  const deps: GameStoreDeps = {
    fetchLive,
    fetchSnapshot,
    storage: memoryStorage(),
    now: () => clock,
    ttlMs: 60_000,
    ...overrides,
  }
  return {
    store: createGameStore(deps),
    deps,
    fetchLive,
    fetchSnapshot,
    advance: (ms: number) => void (clock += ms),
  }
}

describe('loadSnapshot', () => {
  it('returns the build-time snapshot entry for a place', async () => {
    const { store } = setup()
    expect(await store.loadSnapshot(1)).toEqual(game(1, { playing: 1 }))
  })

  it('returns null for places missing from the snapshot', async () => {
    const { store } = setup()
    expect(await store.loadSnapshot(2)).toBeNull()
  })

  it('fetches the snapshot only once', async () => {
    const { store, fetchSnapshot } = setup()
    await Promise.all([store.loadSnapshot(1), store.loadSnapshot(2), store.loadSnapshot(1)])
    expect(fetchSnapshot).toHaveBeenCalledTimes(1)
  })

  it('returns null when the snapshot is unavailable', async () => {
    const { store } = setup({ fetchSnapshot: async () => Promise.reject(new Error('404')) })
    expect(await store.loadSnapshot(1)).toBeNull()
  })
})

describe('loadLive', () => {
  it('batches places requested in the same tick into one fetch', async () => {
    const { store, fetchLive } = setup()

    const [a, b] = await Promise.all([store.loadLive(1), store.loadLive(2)])

    expect(fetchLive).toHaveBeenCalledTimes(1)
    expect(fetchLive.mock.calls[0][0]).toEqual([1, 2])
    expect(a.placeId).toBe(1)
    expect(b.placeId).toBe(2)
  })

  it('dedupes concurrent requests for the same place (e.g. StrictMode)', async () => {
    const { store, fetchLive } = setup()

    const [a, b] = await Promise.all([store.loadLive(1), store.loadLive(1)])

    expect(fetchLive).toHaveBeenCalledTimes(1)
    expect(fetchLive.mock.calls[0][0]).toEqual([1])
    expect(a).toEqual(b)
  })

  it('passes snapshot universe ids and images so they are not re-fetched', async () => {
    const { store, fetchLive } = setup()

    await store.loadLive(1)

    expect(fetchLive.mock.calls[0][1]).toEqual({
      1: { universeId: 1001, imageUrl: 'https://img/1' },
    })
  })

  it('still fetches live data when the snapshot is unavailable', async () => {
    const { store, fetchLive } = setup({ fetchSnapshot: async () => Promise.reject(new Error('x')) })

    const info = await store.loadLive(1)

    expect(info.playing).toBe(99)
    expect(fetchLive.mock.calls[0][1]).toEqual({})
  })

  it('serves a fresh cached result without hitting the network', async () => {
    const { store, fetchLive, advance } = setup()
    await store.loadLive(1)

    advance(30_000)
    const again = await store.loadLive(1)

    expect(fetchLive).toHaveBeenCalledTimes(1)
    expect(again.playing).toBe(99)
  })

  it('refetches when fresh data is requested even though the cache is valid', async () => {
    const { store, fetchLive } = setup()
    await store.loadLive(1)

    await store.loadLive(1, { fresh: true })

    expect(fetchLive).toHaveBeenCalledTimes(2)
  })

  it('caches the result of a fresh load for later normal loads', async () => {
    let visits = 500
    const fetchLive = vi.fn<GameStoreDeps['fetchLive']>(
      async (placeIds) => new Map(placeIds.map((id) => [id, game(id, { visits })])),
    )
    const { store } = setup({ fetchLive })
    await store.loadLive(1)
    visits = 900
    await store.loadLive(1, { fresh: true })

    const again = await store.loadLive(1)

    expect(fetchLive).toHaveBeenCalledTimes(2)
    expect(again.visits).toBe(900)
  })

  it('batches fresh requests made in the same tick into one fetch', async () => {
    const { store, fetchLive } = setup()
    await Promise.all([store.loadLive(1), store.loadLive(2)])

    await Promise.all([store.loadLive(1, { fresh: true }), store.loadLive(2, { fresh: true })])

    expect(fetchLive).toHaveBeenCalledTimes(2)
    expect(fetchLive.mock.calls[1][0]).toEqual([1, 2])
  })

  it('refetches once the cached result is older than the ttl', async () => {
    const { store, fetchLive, advance } = setup()
    await store.loadLive(1)

    advance(61_000)
    await store.loadLive(1)

    expect(fetchLive).toHaveBeenCalledTimes(2)
  })

  it('shares the cache across store instances via storage', async () => {
    const storage = memoryStorage()
    const first = setup({ storage })
    await first.store.loadLive(1)

    const second = setup({ storage })
    const info = await second.store.loadLive(1)

    expect(second.fetchLive).not.toHaveBeenCalled()
    expect(info.playing).toBe(99)
  })

  it('only fetches the places that are not cached', async () => {
    const { store, fetchLive } = setup()
    await store.loadLive(1)

    await Promise.all([store.loadLive(1), store.loadLive(2)])

    expect(fetchLive).toHaveBeenCalledTimes(2)
    expect(fetchLive.mock.calls[1][0]).toEqual([2])
  })

  it('rejects every waiting place when the fetch fails, and does not cache the failure', async () => {
    const fetchLive = vi
      .fn<GameStoreDeps['fetchLive']>()
      .mockRejectedValueOnce(new Error('429'))
      .mockImplementation(async (ids) => new Map(ids.map((id) => [id, game(id)])))
    const { store } = setup({ fetchLive })

    const results = await Promise.allSettled([store.loadLive(1), store.loadLive(2)])
    expect(results.map((r) => r.status)).toEqual(['rejected', 'rejected'])

    await expect(store.loadLive(1)).resolves.toMatchObject({ placeId: 1 })
  })

  it('rejects a place that the API did not return', async () => {
    const { store } = setup({ fetchLive: async () => new Map() })
    await expect(store.loadLive(7)).rejects.toThrow(/7/)
  })

  it('works when storage is unavailable or throws', async () => {
    const broken: Storage = {
      ...memoryStorage(),
      getItem: () => {
        throw new Error('denied')
      },
      setItem: () => {
        throw new Error('denied')
      },
    }
    const { store } = setup({ storage: broken })
    await expect(store.loadLive(1)).resolves.toMatchObject({ placeId: 1 })

    const none = setup({ storage: undefined })
    await expect(none.store.loadLive(1)).resolves.toMatchObject({ placeId: 1 })
  })
})
