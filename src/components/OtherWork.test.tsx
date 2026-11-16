import { render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import OtherWork from './OtherWork.tsx'
import { siteConfig } from '../config.ts'
import { fetchGroupIconUrl, fetchGroupMemberCount } from '../roblox/groupInfo.ts'

vi.mock('../roblox/groupInfo.ts', () => ({
  fetchGroupMemberCount: vi.fn(),
  fetchGroupIconUrl: vi.fn(),
}))

const memberCount = vi.mocked(fetchGroupMemberCount)
const iconUrl = vi.mocked(fetchGroupIconUrl)

beforeEach(() => {
  vi.resetAllMocks()
  memberCount.mockResolvedValue(55375)
  iconUrl.mockResolvedValue('https://tr.rbxcdn.com/icon.png')
})

describe('OtherWork', () => {
  it('is its own section with a level-2 Other Work heading', () => {
    const { container } = render(<OtherWork />)

    const heading = screen.getByRole('heading', { level: 2, name: 'Other Work' })
    const section = container.querySelector('section#other-work')
    expect(section).not.toBeNull()
    expect(section).toHaveAttribute('aria-labelledby', heading.id)
    expect(heading.id).not.toBe('')
  })

  it('lists the appointment system with its student and teacher videos', () => {
    render(<OtherWork />)

    expect(
      screen.getByRole('heading', { level: 3, name: 'Appointment System' }),
    ).toBeInTheDocument()

    const videos = screen.getAllByTestId('other-work-video')
    expect(videos).toHaveLength(2)
    expect(within(videos[0]).getByText('Student side')).toBeInTheDocument()
    expect(within(videos[1]).getByText('Teacher side')).toBeInTheDocument()
  })

  it('plays self-hosted videos from the repo instead of expiring GitHub urls', () => {
    const { container } = render(<OtherWork />)

    const players = [...container.querySelectorAll('video')]
    expect(players).toHaveLength(2)
    for (const video of players) {
      expect(video).toHaveAttribute('controls')
      expect(video).toHaveAttribute('preload', 'metadata')
      expect(video.getAttribute('src')).toMatch(/videos\/appointment-system-(student|teacher)\.mp4$/)
      expect(video.getAttribute('src')).not.toMatch(/github\.com|amazonaws/)
    }
  })

  it('shows the client community with its icon, name, and member count', async () => {
    render(<OtherWork />)

    const client = screen.getByTestId('other-work-client')
    expect(within(client).getByText(/completed on behalf of/i)).toBeInTheDocument()
    expect(
      within(client).getByRole('link', { name: 'Valley Community High School' }),
    ).toHaveAttribute('href', 'https://www.roblox.com/communities/2768830/Valley-Community-High-School')

    const img = await within(client).findByRole('img', {
      name: 'Valley Community High School icon',
    })
    expect(img).toHaveAttribute('src', 'https://tr.rbxcdn.com/icon.png')
    expect(await within(client).findByText('55,375')).toBeInTheDocument()
    expect(within(client).getByText(/members/i)).toBeInTheDocument()

    expect(memberCount).toHaveBeenCalledWith(2768830, expect.anything(), expect.anything())
    expect(iconUrl).toHaveBeenCalledWith(2768830, expect.anything(), expect.anything())
  })

  it('still names the client when the icon and member count cannot load', async () => {
    memberCount.mockRejectedValue(new Error('nope'))
    iconUrl.mockRejectedValue(new Error('nope'))
    render(<OtherWork />)

    const client = screen.getByTestId('other-work-client')
    expect(
      within(client).getByRole('link', { name: 'Valley Community High School' }),
    ).toBeInTheDocument()
    expect(await within(client).findByTitle(/couldn't load/i)).toBeInTheDocument()
    expect(within(client).queryByRole('img')).not.toBeInTheDocument()
  })

  it('is driven by siteConfig.otherWork', () => {
    expect(siteConfig.otherWork).toHaveLength(1)
    expect(siteConfig.otherWork[0].client.groupId).toBe(2768830)
  })
})
