/**
 * Roblox's public web APIs send no CORS headers, so they can't be called from
 * a browser directly. RoProxy mirrors them with `access-control-allow-origin: *`.
 * Its `/v1/groups/{id}` endpoint is unreliable, so the member count is read from
 * the roles endpoint instead.
 */
const GROUPS_HOST = 'https://groups.roproxy.com'

interface GroupRole {
  memberCount: number
  isBase?: boolean
}

/** Fetches the total number of members in a Roblox community (group). */
export async function fetchGroupMemberCount(
  groupId: number,
  fetchImpl: typeof fetch = (...args) => fetch(...args),
  signal?: AbortSignal,
): Promise<number> {
  const url = `${GROUPS_HOST}/v1/groups/${groupId}/roles`
  const res = await fetchImpl(url, { signal })
  if (!res.ok) {
    throw new Error(`Roblox API responded ${res.status} for ${new URL(url).pathname}`)
  }

  const { roles } = (await res.json()) as { roles?: GroupRole[] }
  if (!roles) {
    throw new Error(`Roblox community ${groupId} not found`)
  }

  // The base role's count is the whole community; other roles are subsets.
  const base = roles.find((role) => role.isBase)
  return base ? base.memberCount : roles.reduce((sum, role) => sum + role.memberCount, 0)
}
