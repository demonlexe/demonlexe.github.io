export type AvailabilityStatus = 'open' | 'busy' | 'closed'

export type HeaderTab = 'home' | 'work' | 'stack' | 'contact'

export interface SiteConfig {
  availability: AvailabilityStatus
  /** Roblox user id; the avatar headshot is fetched from this at build/dev time. */
  robloxUserId: number
}

export const siteConfig: SiteConfig = {
  availability: 'open',
  robloxUserId: 81878687,
}
