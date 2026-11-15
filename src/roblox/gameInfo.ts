import { getJson, type RequestOptions } from './client.ts'

export interface GameInfo {
  placeId: number
  universeId: number
  name: string
  /** Players currently in the game. */
  playing: number
  /** All-time visits. */
  visits: number
  /** Thumbnail (or icon fallback) url; null when Roblox has no image for the game. */
  imageUrl: string | null
}

/** Facts that never change between requests, so they needn't be fetched again. */
export interface KnownGame {
  universeId: number
  imageUrl: string | null
}

export interface FetchGamesOptions extends RequestOptions {
  known?: Record<number, KnownGame | undefined>
}

interface ThumbnailEntry {
  state: string
  imageUrl: string
}

export function gameUrl(placeId: number): string {
  return `https://www.roblox.com/games/${placeId}`
}

function firstCompleted(entries: ThumbnailEntry[] | undefined): string | null {
  const entry = entries?.find((e) => e.state === 'Completed' && e.imageUrl)
  return entry?.imageUrl ?? null
}

/** Best-effort images for several universes: thumbnails first, then icons. */
async function fetchImages(
  universeIds: number[],
  options: RequestOptions,
): Promise<Map<number, string>> {
  const images = new Map<number, string>()
  if (universeIds.length === 0) return images

  const thumbnails = await getJson<{
    data?: { universeId: number; thumbnails?: ThumbnailEntry[] }[]
  }>(
    'thumbnails',
    `/v1/games/multiget/thumbnails?universeIds=${universeIds.join(',')}&size=768x432&format=Png&countPerUniverse=1`,
    options,
  ).catch(() => undefined)
  for (const entry of thumbnails?.data ?? []) {
    const url = firstCompleted(entry.thumbnails)
    if (url) images.set(entry.universeId, url)
  }

  const missing = universeIds.filter((id) => !images.has(id))
  if (missing.length === 0) return images

  const icons = await getJson<{ data?: (ThumbnailEntry & { targetId: number })[] }>(
    'thumbnails',
    `/v1/games/icons?universeIds=${missing.join(',')}&size=512x512&format=Png&isCircular=false`,
    options,
  ).catch(() => undefined)
  for (const entry of icons?.data ?? []) {
    const url = firstCompleted([entry])
    if (url) images.set(entry.targetId, url)
  }
  return images
}

/**
 * Fetches live details for several games using as few requests as possible:
 * one for the details and at most two for images, regardless of game count.
 * Universe lookups (one per place) and images are skipped for `known` games.
 * Places the API doesn't return are missing from the result.
 */
export async function fetchGames(
  placeIds: readonly number[],
  { known = {}, ...options }: FetchGamesOptions,
): Promise<Map<number, GameInfo>> {
  const universeByPlace = new Map<number, number>()
  await Promise.all(
    placeIds.map(async (placeId) => {
      const knownUniverse = known[placeId]?.universeId
      if (knownUniverse !== undefined) {
        universeByPlace.set(placeId, knownUniverse)
        return
      }
      const { universeId } = await getJson<{ universeId: number }>(
        'apis',
        `/universes/v1/places/${placeId}/universe`,
        options,
      )
      universeByPlace.set(placeId, universeId)
    }),
  )

  const universeIds = placeIds.map((placeId) => universeByPlace.get(placeId)!)
  const needImages = placeIds
    .filter((placeId) => !known[placeId]?.imageUrl)
    .map((placeId) => universeByPlace.get(placeId)!)

  const [details, fetchedImages] = await Promise.all([
    getJson<{ data?: { id: number; name: string; playing: number; visits: number }[] }>(
      'games',
      `/v1/games?universeIds=${universeIds.join(',')}`,
      options,
    ),
    fetchImages(needImages, options),
  ])

  const byUniverse = new Map((details.data ?? []).map((game) => [game.id, game]))
  const result = new Map<number, GameInfo>()
  for (const placeId of placeIds) {
    const universeId = universeByPlace.get(placeId)!
    const game = byUniverse.get(universeId)
    if (!game) continue
    result.set(placeId, {
      placeId,
      universeId,
      name: game.name,
      playing: game.playing,
      visits: game.visits,
      imageUrl: known[placeId]?.imageUrl ?? fetchedImages.get(universeId) ?? null,
    })
  }
  return result
}
