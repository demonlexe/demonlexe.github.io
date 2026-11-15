export type AvailabilityStatus = 'open' | 'busy' | 'closed'

export type HeaderTab = 'home' | 'work' | 'stack' | 'contact'

export interface SiteConfig {
  availability: AvailabilityStatus
}

export const siteConfig: SiteConfig = {
  availability: 'open',
}
