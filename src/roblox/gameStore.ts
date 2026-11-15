import { PROXY_HOSTS } from './client.ts'
import { fetchGames, type GameInfo, type KnownGame } from './gameInfo.ts'

export interface GameStoreDeps {
  /** Fetches live details for several places in one go. */
  fetchLive: (
    placeIds: number[],
    known: Record<number, KnownGame>,
  ) => Promise<Map<number, GameInfo>>
  /** Loads the build-time snapshot of every game, keyed by place id. */
  fetchSnapshot: () => Promise<Record<number, GameInfo>>
  /** Where fresh results are cached across page loads; optional. */
  storage?: Storage | undefined
  now: () => number
  /** How long a cached live result is served before refetching. */
  ttlMs: number
}

export interface GameStore {
  /** The build-time snapshot for a place, or null if unavailable. Never rejects. */
  loadSnapshot: (placeId: number) => Promise<GameInfo | null>
  /**
   * Live details for a place. Requests made in the same tick are sent as one
   * batch, duplicates are shared, and results are cached for `ttlMs`.
   */
  loadLive: (placeId: number) => Promise<GameInfo>
}

interface Deferred {
  promise: Promise<GameInfo>
  resolve: (info: GameInfo) => void
  reject: (error: unknown) => void
}

const CACHE_PREFIX = 'roblox-game:v1:'

export function createGameStore(deps: GameStoreDeps): GameStore {
  const { fetchLive, fetchSnapshot, storage, now, ttlMs } = deps
  let snapshot: Promise<Record<number, GameInfo>> | undefined
  const inflight = new Map<number, Deferred>()
  let pending: number[] = []

  const getSnapshot = () =>
    (snapshot ??= fetchSnapshot().catch((): Record<number, GameInfo> => ({})))

  function readCache(placeId: number): GameInfo | null {
    try {
      const raw = storage?.getItem(CACHE_PREFIX + placeId)
      if (!raw) return null
      const entry = JSON.parse(raw) as { at: number; info: GameInfo }
      return now() - entry.at < ttlMs ? entry.info : null
    } catch {
      return null
    }
  }

  function writeCache(info: GameInfo) {
    try {
      storage?.setItem(CACHE_PREFIX + info.placeId, JSON.stringify({ at: now(), info }))
    } catch {
      // Storage full or blocked: caching is an optimisation only.
    }
  }

  async function flush() {
    const placeIds = pending
    pending = []
    try {
      const snap = await getSnapshot()
      const known: Record<number, KnownGame> = {}
      for (const placeId of placeIds) {
        const entry = snap[placeId]
        if (entry) known[placeId] = { universeId: entry.universeId, imageUrl: entry.imageUrl }
      }
      const results = await fetchLive(placeIds, known)
      for (const placeId of placeIds) {
        const waiter = inflight.get(placeId)!
        inflight.delete(placeId)
        const info = results.get(placeId)
        if (info) {
          writeCache(info)
          waiter.resolve(info)
        } else {
          waiter.reject(new Error(`Roblox game for place ${placeId} not found`))
        }
      }
    } catch (error) {
      for (const placeId of placeIds) {
        inflight.get(placeId)?.reject(error)
        inflight.delete(placeId)
      }
    }
  }

  return {
    async loadSnapshot(placeId) {
      return (await getSnapshot())[placeId] ?? null
    },

    loadLive(placeId) {
      const cached = readCache(placeId)
      if (cached) return Promise.resolve(cached)

      const existing = inflight.get(placeId)
      if (existing) return existing.promise

      let resolve!: Deferred['resolve']
      let reject!: Deferred['reject']
      const promise = new Promise<GameInfo>((res, rej) => {
        resolve = res
        reject = rej
      })
      inflight.set(placeId, { promise, resolve, reject })
      if (pending.length === 0) setTimeout(flush, 0)
      pending.push(placeId)
      return promise
    },
  }
}

function sessionStorageOrUndefined(): Storage | undefined {
  try {
    return window.sessionStorage
  } catch {
    return undefined
  }
}

export const GAMES_SNAPSHOT_URL = `${import.meta.env.BASE_URL}games.json`

/** The app-wide store: build-time snapshot first, live data from proxies on top. */
export const gameStore = createGameStore({
  fetchLive: (placeIds, known) => fetchGames(placeIds, { hosts: PROXY_HOSTS, known }),
  fetchSnapshot: async () => {
    const res = await fetch(GAMES_SNAPSHOT_URL)
    if (!res.ok) throw new Error(`games snapshot responded ${res.status}`)
    return (await res.json()) as Record<number, GameInfo>
  },
  storage: sessionStorageOrUndefined(),
  now: () => Date.now(),
  ttlMs: 60_000,
})
