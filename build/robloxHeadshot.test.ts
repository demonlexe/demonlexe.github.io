import { describe, expect, it, vi } from 'vitest'
import { fetchRobloxHeadshot, headshotApiUrl } from './robloxHeadshot.ts'

const IMAGE_URL = 'https://tr.rbxcdn.com/abc/150/150/AvatarHeadshot/Png/noFilter'

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), init)
}

describe('headshotApiUrl', () => {
  it('builds the thumbnails API url for the given user id', () => {
    const url = new URL(headshotApiUrl(81878687))
    expect(url.origin + url.pathname).toBe(
      'https://thumbnails.roblox.com/v1/users/avatar-headshot',
    )
    expect(url.searchParams.get('userIds')).toBe('81878687')
    expect(url.searchParams.get('format')).toBe('Png')
  })
})

describe('fetchRobloxHeadshot', () => {
  it('resolves the image url from the API and returns the image bytes', async () => {
    const bytes = new Uint8Array([137, 80, 78, 71])
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse({
          data: [{ targetId: 81878687, state: 'Completed', imageUrl: IMAGE_URL }],
        }),
      )
      .mockResolvedValueOnce(new Response(bytes))

    const result = await fetchRobloxHeadshot(81878687, fetchMock)

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(String(fetchMock.mock.calls[0][0])).toBe(headshotApiUrl(81878687))
    expect(String(fetchMock.mock.calls[1][0])).toBe(IMAGE_URL)
    expect(new Uint8Array(result)).toEqual(bytes)
  })

  it('throws when the thumbnail is not completed', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse({ data: [{ targetId: 1, state: 'Pending', imageUrl: '' }] }),
    )

    await expect(fetchRobloxHeadshot(1, fetchMock)).rejects.toThrow(/Pending/)
  })

  it('throws when the API request fails', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response('nope', { status: 429 }))

    await expect(fetchRobloxHeadshot(1, fetchMock)).rejects.toThrow(/429/)
  })

  it('throws when the image download fails', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse({
          data: [{ targetId: 1, state: 'Completed', imageUrl: IMAGE_URL }],
        }),
      )
      .mockResolvedValueOnce(new Response('gone', { status: 404 }))

    await expect(fetchRobloxHeadshot(1, fetchMock)).rejects.toThrow(/404/)
  })
})
