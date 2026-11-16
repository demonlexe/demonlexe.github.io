import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ContactInfo from './ContactInfo.tsx'

describe('ContactInfo', () => {
  it('has no heading of its own; the links sit directly under the Contact section heading', () => {
    render(<ContactInfo />)

    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    expect(screen.getByRole('list', { name: /contact links/i })).toBeInTheDocument()
  })

  it('links to Discord using the configured user ID', () => {
    render(
      <ContactInfo
        contact={{ discordUserId: '123456789', robloxUsername: 'DemonLexe', githubUsername: 'demonlexe' }}
      />,
    )

    const link = screen.getByRole('link', { name: /discord/i })
    expect(link).toHaveAttribute('href', 'https://discord.com/users/123456789')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'))
  })

  it('links to the Roblox profile using the configured username', () => {
    render(
      <ContactInfo contact={{ discordUserId: '1', robloxUsername: 'DemonLexe', githubUsername: 'demonlexe' }} />,
    )

    const link = screen.getByRole('link', { name: /roblox/i })
    expect(link).toHaveAttribute('href', 'https://www.roblox.com/users/profile?username=DemonLexe')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('links to GitHub using the configured username', () => {
    render(
      <ContactInfo contact={{ discordUserId: '1', robloxUsername: 'DemonLexe', githubUsername: 'someone' }} />,
    )

    const link = screen.getByRole('link', { name: /github/i })
    expect(link).toHaveAttribute('href', 'https://github.com/someone')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'))
  })

  it('labels the links "Discord (demonlexe)", "Roblox Profile" and "GitHub"', () => {
    render(<ContactInfo />)

    const labels = screen.getAllByRole('link').map((link) => link.textContent)
    expect(labels).toEqual(['Discord (demonlexe)', 'Roblox Profile', 'GitHub'])
  })

  it('marks Discord with a star as the recommended contact method', () => {
    render(<ContactInfo />)

    const star = screen.getByRole('img', { name: /recommended/i })
    const discordItem = screen.getByRole('link', { name: /discord/i }).closest('li')
    expect(discordItem).toContainElement(star)
    expect(screen.getAllByRole('img')).toHaveLength(1)
  })

  it('renders the contact links at a larger font size', () => {
    render(<ContactInfo />)

    expect(screen.getByRole('list', { name: /contact links/i })).toHaveClass('fs-4')
  })

  it('reads defaults from site config', () => {
    render(<ContactInfo />)

    expect(screen.getByRole('link', { name: /discord/i })).toHaveAttribute(
      'href',
      expect.stringMatching(/^https:\/\/discord\.com\/users\/.+/),
    )
    expect(screen.getByRole('link', { name: /roblox/i })).toBeInTheDocument()
  })
})
