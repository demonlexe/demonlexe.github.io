import { describe, expect, it } from 'vitest'
import { siteConfig } from './config.ts'

describe('siteConfig', () => {
  it('defaults availability to open', () => {
    expect(siteConfig.availability).toBe('open')
  })

  it('stores the Roblox user id used to fetch the avatar headshot', () => {
    expect(siteConfig.robloxUserId).toBe(81878687)
  })

  it('defines the home page tagline', () => {
    expect(siteConfig.tagline).toBe(
      'Full-stack developer with 10+ YoE creating fun, engaging ROBLOX games',
    )
  })

  it('defines contact details with a Discord user ID and Roblox username', () => {
    expect(siteConfig.contact.discordUserId).toEqual(expect.any(String))
    expect(siteConfig.contact.discordUserId.length).toBeGreaterThan(0)
    expect(siteConfig.contact.robloxUsername).toBe('DemonLexe')
  })

  it('lists the games shown in the Work section by Roblox place id', () => {
    expect(siteConfig.games).toEqual([
      { placeId: 85115018573521 },
      { placeId: 125204338128040 },
    ])
  })

  it('lists the communities whose members are totalled in About Me by Roblox group id', () => {
    expect(siteConfig.communities).toEqual([
      // HexPlum
      { groupId: 6323399 },
      // CastawayStudios (owns Clean a Beach)
      { groupId: 10804046 },
    ])
  })

  it('defines the hourly rate for small projects', () => {
    expect(siteConfig.pricing.hourlyRateUsd).toBe(30)
  })

  it('accepts Robux and PayPal (USD) as payment methods', () => {
    expect(siteConfig.paymentMethods).toEqual(['Robux', 'PayPal (USD)'])
  })

  describe('seo', () => {
    it('uses an absolute https site url', () => {
      expect(siteConfig.seo.siteUrl).toBe('https://demonlexe.github.io/')
    })

    it('keeps the title and description within search result limits', () => {
      expect(siteConfig.seo.title.length).toBeLessThanOrEqual(60)
      expect(siteConfig.seo.description.length).toBeGreaterThanOrEqual(70)
      expect(siteConfig.seo.description.length).toBeLessThanOrEqual(160)
    })

    it('targets Roblox developer hiring keywords without duplicates', () => {
      const keywords = siteConfig.seo.keywords.map((k) => k.toLowerCase())
      expect(keywords).toEqual(
        expect.arrayContaining([
          'roblox developer',
          'roblox scripter',
          'hire roblox developer',
          'roblox game developer',
          'luau',
        ]),
      )
      expect(new Set(keywords).size).toBe(keywords.length)
      expect(keywords.length).toBeLessThanOrEqual(15)
    })

    it('mentions the primary keyword in the title and description', () => {
      expect(siteConfig.seo.title).toMatch(/roblox developer/i)
      expect(siteConfig.seo.description).toMatch(/roblox developer/i)
    })
  })

  it('defines the profile used by the About Me section', () => {
    expect(siteConfig.profile).toEqual({
      username: 'DemonLexe',
      yearsOfExperience: 10,
      skills: ['Frontend', 'Backend', 'Web', 'UI design', 'Basic modelling', 'Social media', 'Basic animation'],
    })
  })
})
