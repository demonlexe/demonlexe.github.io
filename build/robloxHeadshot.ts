import type { Plugin } from 'vite'

export const HEADSHOT_FILENAME = 'headshot.png'

interface ThumbnailResponse {
  data?: { state: string; imageUrl: string }[]
}

export function headshotApiUrl(userId: number): string {
  const params = new URLSearchParams({
    userIds: String(userId),
    size: '420x420',
    format: 'Png',
    isCircular: 'false',
  })
  return `https://thumbnails.roblox.com/v1/users/avatar-headshot?${params}`
}

/**
 * Downloads a user's Roblox avatar headshot. The thumbnails API sends no CORS
 * headers, so this runs at build/dev-server time instead of in the browser.
 */
export async function fetchRobloxHeadshot(
  userId: number,
  fetchImpl: typeof fetch = fetch,
): Promise<ArrayBuffer> {
  const apiRes = await fetchImpl(headshotApiUrl(userId))
  if (!apiRes.ok) {
    throw new Error(`Roblox thumbnails API responded ${apiRes.status}`)
  }

  const entry = ((await apiRes.json()) as ThumbnailResponse).data?.[0]
  if (!entry || entry.state !== 'Completed' || !entry.imageUrl) {
    throw new Error(
      `Roblox headshot for user ${userId} is not available (state: ${entry?.state ?? 'missing'})`,
    )
  }

  const imageRes = await fetchImpl(entry.imageUrl)
  if (!imageRes.ok) {
    throw new Error(`Roblox headshot image download responded ${imageRes.status}`)
  }
  return imageRes.arrayBuffer()
}

/** Serves the headshot at `/headshot.png` in dev and emits it on build. */
export function robloxHeadshotPlugin(userId: number): Plugin {
  let headshot: Promise<Buffer> | undefined
  const load = () =>
    (headshot ??= fetchRobloxHeadshot(userId).then((buf) => Buffer.from(buf)))

  return {
    name: 'roblox-headshot',
    async buildStart() {
      if (this.environment.mode !== 'build') return
      this.emitFile({
        type: 'asset',
        fileName: HEADSHOT_FILENAME,
        source: await load(),
      })
    },
    configureServer(server) {
      server.middlewares.use(`/${HEADSHOT_FILENAME}`, (_req, res, next) => {
        load().then(
          (body) => {
            res.setHeader('Content-Type', 'image/png')
            res.end(body)
          },
          next,
        )
      })
    },
  }
}
