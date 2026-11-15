import { describe, expect, it, vi } from 'vitest'
import { fetchGroupMemberCount } from './groupInfo.ts'

function json(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), init)
}

describe('fetchGroupMemberCount', () => {
  it('returns the base role member count, which is the total community size', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      json({
        groupId: 6323399,
        roles: [
          { id: 1, name: 'Guest', rank: 0, memberCount: 0 },
          { id: 2, name: 'Member', rank: 1, memberCount: 2856, isBase: true },
          { id: 3, name: 'Member', rank: 1, memberCount: 2842 },
          { id: 4, name: 'Beta Tester', rank: 253, memberCount: 13 },
        ],
      }),
    )

    await expect(fetchGroupMemberCount(6323399, fetchMock)).resolves.toBe(2856)
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      'https://groups.roproxy.com/v1/groups/6323399/roles',
    )
  })

  it('sums every role when no base role is flagged', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      json({
        roles: [
          { id: 1, memberCount: 10 },
          { id: 2, memberCount: 5 },
        ],
      }),
    )

    await expect(fetchGroupMemberCount(1, fetchMock)).resolves.toBe(15)
  })

  it('passes the abort signal through to fetch', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => json({ roles: [] }))
    const controller = new AbortController()

    await fetchGroupMemberCount(1, fetchMock, controller.signal)

    expect(fetchMock.mock.calls[0][1]).toEqual({ signal: controller.signal })
  })

  it('rejects when the API responds with an error status', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => json({}, { status: 429 }))

    await expect(fetchGroupMemberCount(1, fetchMock)).rejects.toThrow(/429/)
  })

  it('rejects when the response has no roles', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => json({}))

    await expect(fetchGroupMemberCount(1, fetchMock)).rejects.toThrow(/not found/i)
  })
})
