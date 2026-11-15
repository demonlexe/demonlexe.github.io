import type { Plugin } from 'vite'
import { DIRECT_HOSTS } from '../src/roblox/client.ts'
import { fetchGames, type GameInfo } from '../src/roblox/gameInfo.ts'

export const GAMES_SNAPSHOT_FILENAME = 'games.json'

/**
 * Fetches every game straight from Roblox (no CORS proxy needed outside the
 * browser). The snapshot is what visitors see instantly and when the live
 * proxies are rate limited, so a failure here yields an empty snapshot rather
 * than failing the build.
 */
export async function fetchGamesSnapshot(
  placeIds: readonly number[],
  fetchImpl: typeof fetch = fetch,
): Promise<Record<number, GameInfo>> {
  try {
    const games = await fetchGames(placeIds, {
      hosts: DIRECT_HOSTS,
      fetchImpl,
      maxAttempts: 3,
    })
    return Object.fromEntries(games)
  } catch (error) {
    console.warn(`[roblox-games] could not build games snapshot: ${String(error)}`)
    return {}
  }
}

/** Serves the snapshot at `/games.json` in dev and emits it on build. */
export function robloxGamesPlugin(placeIds: readonly number[]): Plugin {
  let snapshot: Promise<string> | undefined
  const load = () =>
    (snapshot ??= fetchGamesSnapshot(placeIds).then((games) => JSON.stringify(games)))

  return {
    name: 'roblox-games',
    async buildStart() {
      if (this.environment.mode !== 'build') return
      this.emitFile({
        type: 'asset',
        fileName: GAMES_SNAPSHOT_FILENAME,
        source: await load(),
      })
    },
    configureServer(server) {
      server.middlewares.use(`/${GAMES_SNAPSHOT_FILENAME}`, (_req, res, next) => {
        load().then((body) => {
          res.setHeader('Content-Type', 'application/json')
          res.end(body)
        }, next)
      })
    },
  }
}
