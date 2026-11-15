import { describe, expect, it } from 'vitest'
import { siteConfig } from './config.ts'

describe('siteConfig', () => {
  it('defaults availability to open', () => {
    expect(siteConfig.availability).toBe('open')
  })
})
