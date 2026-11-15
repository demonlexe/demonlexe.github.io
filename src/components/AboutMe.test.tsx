import { render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AboutMe from './AboutMe.tsx'
import * as gameInfo from '../roblox/gameInfo.ts'
import * as groupInfo from '../roblox/groupInfo.ts'

const VISITS: Record<number, number> = {
  85115018573521: 6106400,
  125204338128040: 7795,
}
const MEMBERS: Record<number, number> = {
  6323399: 2856,
  10804046: 97,
}

beforeEach(() => {
  vi.spyOn(gameInfo, 'fetchGameInfo').mockImplementation(async (placeId) => ({
    name: 'Game',
    playing: 0,
    visits: VISITS[placeId],
    imageUrl: null,
  }))
  vi.spyOn(groupInfo, 'fetchGroupMemberCount').mockImplementation(
    async (groupId) => MEMBERS[groupId],
  )
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('AboutMe', () => {
  it('shows total visits across every Work game, once loaded', async () => {
    render(<AboutMe />)

    const term = screen.getByText('Total visits')
    expect(term.tagName).toBe('DT')
    expect(term.nextElementSibling).toHaveTextContent('…')

    expect(await screen.findByText('6,114,195+')).toBe(term.nextElementSibling)
    expect(gameInfo.fetchGameInfo).toHaveBeenCalledWith(
      85115018573521,
      expect.anything(),
      expect.anything(),
    )
    expect(gameInfo.fetchGameInfo).toHaveBeenCalledWith(
      125204338128040,
      expect.anything(),
      expect.anything(),
    )
  })

  it('shows community members summed across every community, once loaded', async () => {
    render(<AboutMe />)

    const term = screen.getByText('Community members')
    expect(term.tagName).toBe('DT')
    expect(term.nextElementSibling).toHaveTextContent('…')

    expect(await screen.findByText('2,953+')).toBe(term.nextElementSibling)
    expect(groupInfo.fetchGroupMemberCount).toHaveBeenCalledWith(
      6323399,
      expect.anything(),
      expect.anything(),
    )
    expect(groupInfo.fetchGroupMemberCount).toHaveBeenCalledWith(
      10804046,
      expect.anything(),
      expect.anything(),
    )
  })

  it('orders the stats after the experience row and before the skillset', () => {
    render(<AboutMe />)

    const labels = screen.getAllByRole('term').map((el) => el.textContent)
    expect(labels).toEqual([
      'Username',
      'Experience',
      'Total visits',
      'Community members',
      'Skillset',
    ])
  })

  it('shows a dash for a stat that fails to load, without breaking the other', async () => {
    vi.spyOn(gameInfo, 'fetchGameInfo').mockRejectedValue(new Error('boom'))

    render(<AboutMe />)

    expect(await screen.findByText('2,953+')).toBeInTheDocument()
    expect(screen.getByText('Total visits').nextElementSibling).toHaveTextContent('—')
  })

  it('totals only the games and communities it is given', async () => {
    render(
      <AboutMe games={[{ placeId: 125204338128040 }]} communities={[{ groupId: 10804046 }]} />,
    )

    expect(await screen.findByText('7,795+')).toBeInTheDocument()
    expect(await screen.findByText('97+')).toBeInTheDocument()
  })

  it('renders an ABOUT ME heading', () => {
    render(<AboutMe />)

    expect(screen.getByRole('heading', { level: 2, name: /about me/i })).toBeInTheDocument()
  })

  it('places a divider between the heading and the username', () => {
    render(<AboutMe />)

    const heading = screen.getByRole('heading', { level: 2, name: /about me/i })
    const divider = screen.getByRole('separator')
    const username = screen.getByText('Username')

    expect(heading.compareDocumentPosition(divider) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(divider.compareDocumentPosition(username) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('shows the username and years of experience from config', () => {
    render(<AboutMe />)

    expect(screen.getByText('DemonLexe')).toBeInTheDocument()
    expect(screen.getByText('10 years')).toBeInTheDocument()
  })

  it('lists every skill in the skillset', () => {
    render(<AboutMe />)

    const skills = within(screen.getByRole('list', { name: /skillset/i })).getAllByRole('listitem')
    expect(skills.map((item) => item.textContent)).toEqual([
      'Frontend',
      'Backend',
      'Web',
      'UI design',
      'Basic modelling',
      'Social media',
      'Basic animation',
    ])
    for (const item of skills) {
      expect(item).toHaveClass('skill-lozenge')
    }
  })

  it('accepts a custom profile', () => {
    render(
      <AboutMe
        profile={{ username: 'Someone', yearsOfExperience: 1, skills: ['Scripting'] }}
      />,
    )

    expect(screen.getByText('Someone')).toBeInTheDocument()
    expect(screen.getByText('1 year')).toBeInTheDocument()
    expect(screen.getByRole('listitem')).toHaveTextContent('Scripting')
  })
})
