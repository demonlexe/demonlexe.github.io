/**
 * Roblox's public web APIs send no CORS headers, so browsers can't call them
 * directly. These community mirrors do, and are tried in order: when one is
 * rate limited (they cap requests per IP) the request fails over to the next.
 * `{service}` is the API subdomain, e.g. `games` or `thumbnails`.
 */
export const PROXY_HOSTS = [
  'https://{service}.roproxy.com',
  'https://{service}.rotunnel.com',
] as const

/** Roblox itself; only usable server-side (build time, Node). */
export const DIRECT_HOSTS = ['https://{service}.roblox.com'] as const

export interface RequestOptions {
  /** Host templates tried in order, cycling on retry. */
  hosts: readonly string[]
  fetchImpl?: typeof fetch
  sleep?: (ms: number) => Promise<void>
  /** Total tries per request across all hosts. Defaults to 4. */
  maxAttempts?: number
  signal?: AbortSignal
}

const DEFAULT_MAX_ATTEMPTS = 4
const BASE_DELAY_MS = 400
const MAX_DELAY_MS = 3000

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

class HttpError extends Error {
  readonly status: number
  readonly retryAfterMs: number | undefined

  constructor(status: number, path: string, retryAfterMs?: number) {
    super(`Roblox API responded ${status} for ${path.split('?')[0]}`)
    this.status = status
    this.retryAfterMs = retryAfterMs
  }

  get retryable(): boolean {
    return this.status === 429 || this.status >= 500
  }
}

function retryAfterMs(res: Response): number | undefined {
  const seconds = Number(res.headers.get('retry-after'))
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : undefined
}

/**
 * GETs JSON from a Roblox API. Retryable failures (429, 5xx, network errors)
 * fail over to the next host straight away, and only back off once every
 * host has been tried.
 */
export async function getJson<T>(
  service: string,
  path: string,
  {
    hosts,
    fetchImpl = (...args) => fetch(...args),
    sleep = defaultSleep,
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
    signal,
  }: RequestOptions,
): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const url = hosts[attempt % hosts.length].replace('{service}', service) + path
    let retryAfter: number | undefined
    try {
      const res = await fetchImpl(url, { signal })
      if (res.ok) return (await res.json()) as T
      const error = new HttpError(res.status, path, retryAfterMs(res))
      if (!error.retryable) throw error
      lastError = error
      retryAfter = error.retryAfterMs
    } catch (error) {
      if (signal?.aborted || (error instanceof HttpError && !error.retryable)) throw error
      lastError = error
    }

    const finishedHostCycle = (attempt + 1) % hosts.length === 0
    if (attempt + 1 < maxAttempts && finishedHostCycle) {
      const cycle = Math.floor(attempt / hosts.length)
      await sleep(Math.min(retryAfter ?? BASE_DELAY_MS * 2 ** cycle, MAX_DELAY_MS))
    }
  }
  throw lastError
}
