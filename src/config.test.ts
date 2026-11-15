import { describe, expect, it } from 'vitest'
import { siteConfig } from './config.ts'

describe('siteConfig', () => {
  it('defaults availability to open', () => {
    expect(siteConfig.availability).toBe('open')
  })

  it('stores the Roblox user id used to fetch the avatar headshot', () => {
    expect(siteConfig.robloxUserId).toBe(81878687)
  })
})
