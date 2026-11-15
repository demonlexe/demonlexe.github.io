import { PROXY_HOSTS, getJson, type RequestOptions } from './client.ts'

/**
 * Its `/v1/groups/{id}` endpoint is unreliable on the proxies, so the member
 * count is read from the roles endpoint instead.
 */

interface GroupRole {
  memberCount: number
  isBase?: boolean
}

/** Fetches the total number of members in a Roblox community (group). */
export async function fetchGroupMemberCount(
  groupId: number,
  fetchImpl: typeof fetch = (...args) => fetch(...args),
  signal?: AbortSignal,
  options: Partial<RequestOptions> = {},
): Promise<number> {
  const { roles } = await getJson<{ roles?: GroupRole[] }>(
    'groups',
    `/v1/groups/${groupId}/roles`,
    { hosts: PROXY_HOSTS, ...options, fetchImpl, signal },
  )
  if (!roles) {
    throw new Error(`Roblox community ${groupId} not found`)
  }

  // The base role's count is the whole community; other roles are subsets.
  const base = roles.find((role) => role.isBase)
  return base ? base.memberCount : roles.reduce((sum, role) => sum + role.memberCount, 0)
}
