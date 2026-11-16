import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.tsx'
import { siteConfig } from './config.ts'

vi.mock('./roblox/gameStore.ts', () => ({
  gameStore: {
    loadSnapshot: vi.fn(async () => null),
    loadLive: vi.fn(async (placeId: number) => ({
      placeId,
      universeId: 1,
      name:
        placeId === 85115018573521
          ? 'Pick a Gear Tower 💥'
          : placeId === 125204338128040
            ? 'Clean a Beach'
            : `Game ${placeId}`,
      playing: 79,
      visits: 6106400,
      imageUrl: 'https://tr.rbxcdn.com/thumb.png',
    })),
  },
}))

vi.mock('./roblox/groupInfo.ts', () => ({
  fetchGroupMemberCount: vi.fn(async () => 100),
  fetchGroupIconUrl: vi.fn(async () => 'https://tr.rbxcdn.com/icon.png'),
}))

describe('App', () => {
  const originalShowOtherWork = siteConfig.showOtherWork

  afterEach(() => {
    siteConfig.showOtherWork = originalShowOtherWork
  })

  describe('showOtherWork toggle', () => {
    it('hides the Other Work section when the toggle is off', () => {
      siteConfig.showOtherWork = false
      const { container } = render(<App />)

      expect(container.querySelector('#other-work')).toBeNull()
      expect(screen.queryByRole('heading', { name: 'Other Work' })).not.toBeInTheDocument()
      expect(container.querySelectorAll('main > section')).toHaveLength(6)
    })

    it('shows the Other Work section, between My Games and Testimonials, when the toggle is on', () => {
      siteConfig.showOtherWork = true
      const { container } = render(<App />)

      expect(screen.getByRole('heading', { level: 2, name: 'Other Work' })).toBeInTheDocument()
      expect([...container.querySelectorAll('main > section')].map((el) => el.id)).toEqual([
        'home', 'work', 'other-work', 'testimonials', 'stack', 'pricing', 'contact',
      ])
    })
  })

  it('shows total visits and community members in About Me', async () => {
    render(<App />)

    // 5 games x 6,106,400 visits; 2 communities x 100 members
    expect(await screen.findByText('30,532,000+')).toBeInTheDocument()
    expect(await screen.findByText('200+')).toBeInTheDocument()
    expect(screen.getByText('Total visits')).toBeInTheDocument()
    expect(screen.getByText('Community members')).toBeInTheDocument()
  })

  it('opens every external link in a new tab, without leaking the opener', async () => {
    const { container } = render(<App />)
    await screen.findByText('30,532,000+')

    const external = [...container.querySelectorAll<HTMLAnchorElement>('a[href]')].filter(
      (a) => /^https?:\/\//.test(a.getAttribute('href') ?? ''),
    )
    expect(external.length).toBeGreaterThan(0)
    for (const link of external) {
      expect(link, link.outerHTML).toHaveAttribute('target', '_blank')
      expect(link.getAttribute('rel') ?? '', link.outerHTML).toMatch(/noopener|noreferrer/)
    }
  })

  it('renders the header with DemonLexe, default lozenge, and 4 tabs', () => {
    render(<App />)

    expect(screen.getByTestId('availability-lozenge')).toHaveTextContent('For Hire: Open')
    expect(screen.getByRole('link', { name: 'Home' })).toHaveClass('active')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('DemonLexe')
  })

  it('places the avatar to the left of the username and subtitle', () => {
    render(<App />)

    const img = screen.getByRole('img', { name: /Roblox avatar/i })
    const heading = screen.getByRole('heading', { level: 1 })
    const subtitle = screen.getByText(siteConfig.tagline)
    const row = img.parentElement as HTMLElement

    expect(row).toHaveClass('d-flex')
    expect(row).not.toHaveClass('flex-column')
    expect(row).toContainElement(heading)
    expect(row).toContainElement(subtitle)
    expect(img.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(heading.compareDocumentPosition(subtitle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(Number(img.getAttribute('width'))).toBeLessThanOrEqual(96)
  })

  it('bobs the avatar and adds vfx to the username on the home page', () => {
    render(<App />)

    expect(screen.getByRole('img', { name: /Roblox avatar/i })).toHaveClass('headshot--bobbing')
    expect(screen.getByRole('heading', { level: 1 })).toHaveClass('username-vfx')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('DemonLexe')
  })

  it('shows the Roblox avatar headshot', () => {
    render(<App />)

    const img = screen.getByRole('img', { name: /DemonLexe.*Roblox avatar/i })
    expect(img).toHaveAttribute('src', expect.stringMatching(/headshot\.png$/))
  })

  it('renders all seven sections stacked on one page with their headings', () => {
    siteConfig.showOtherWork = true
    const { container } = render(<App />)

    expect(container.querySelectorAll('main')).toHaveLength(1)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)

    const expected: [string, number, string][] = [
      ['home', 1, 'DemonLexe'],
      ['work', 2, 'My Games'],
      ['other-work', 2, 'Other Work'],
      ['testimonials', 2, 'Testimonials'],
      ['stack', 2, 'Technologies used'],
      ['pricing', 2, 'Pricing & Payment'],
      ['contact', 2, 'Contact'],
    ]
    const ids = [...container.querySelectorAll('main > section')].map((el) => el.id)
    expect(ids).toEqual(['home', 'work', 'other-work', 'testimonials', 'stack', 'pricing', 'contact'])

    for (const [id, level, name] of expected) {
      const section = container.querySelector(`main > section#${id}`) as HTMLElement
      expect(section).not.toBeNull()
      const heading = within(section).getByRole('heading', { level, name })
      expect(section).toHaveAttribute('aria-labelledby', heading.id)
      expect(heading.id).not.toBe('')
    }

    const stack = within(container.querySelector('#stack') as HTMLElement)
    expect(stack.getByText('Tools I use to build and ship Roblox games.')).toBeInTheDocument()
    expect(stack.getByRole('link', { name: 'Rojo' })).toBeInTheDocument()
    expect(stack.getByRole('heading', { level: 3, name: 'Version control' })).toBeInTheDocument()
  })

  it('has a single gradient divider, above About Me, and none between sections', () => {
    const { container } = render(<App />)

    const dividers = screen.getAllByRole('separator')
    expect(dividers).toHaveLength(1)
    expect(dividers[0]).toHaveClass('section-divider')
    expect(dividers[0].nextElementSibling).toBe(
      screen.getByRole('heading', { level: 2, name: /about me/i }),
    )

    // Sections sit directly next to each other.
    const children = [...(container.querySelector('main') as HTMLElement).children]
    expect(children.map((el) => el.tagName)).toEqual(Array(6).fill('SECTION'))
  })

  it('puts a matching icon to the left of every section title', () => {
    const { container } = render(<App />)

    const expected: [string, string][] = [
      ['about-me-heading', 'about'],
      ['work-heading', 'work'],
      ['testimonials-heading', 'testimonials'],
      ['stack-heading', 'stack'],
      ['pricing-payment-heading', 'pricing'],
      ['contact-section-heading', 'contact'],
    ]
    for (const [headingId, icon] of expected) {
      const heading = container.querySelector(`#${headingId}`) as HTMLElement
      expect(heading.firstElementChild).toHaveClass('section-icon', `section-icon--${icon}`)
      expect(heading.firstElementChild).toHaveAttribute('aria-hidden', 'true')
    }
    // The icon doesn't change a title's accessible name.
    expect(screen.getByRole('heading', { level: 2, name: 'My Games' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Technologies used' })).toBeInTheDocument()
  })

  it('shows every section content at once without clicking any tab', async () => {
    const { container } = render(<App />)

    const home = container.querySelector('#home') as HTMLElement
    const work = container.querySelector('#work') as HTMLElement
    const contact = container.querySelector('#contact') as HTMLElement

    expect(within(home).getByRole('heading', { level: 2, name: /about me/i })).toBeInTheDocument()
    expect(within(home).getByRole('separator')).toBeInTheDocument()
    expect(within(home).getByRole('img', { name: /Roblox avatar/i })).toBeInTheDocument()

    expect(await within(work).findByRole('heading', { level: 3, name: 'Pick a Gear Tower 💥' })).toBeInTheDocument()
    expect(await within(work).findByRole('heading', { level: 3, name: 'Clean a Beach' })).toBeInTheDocument()
    expect(within(work).getAllByTestId('game-card')).toHaveLength(5)
    expect(
      within(work).getByText('These are games I own and developed from start to finish.'),
    ).toBeInTheDocument()

    expect(within(contact).queryByRole('heading', { name: /message me/i })).not.toBeInTheDocument()
    expect(within(contact).queryByRole('heading', { name: /pricing & payment/i })).not.toBeInTheDocument()
    const pricing = container.querySelector('#pricing') as HTMLElement
    expect(within(pricing).getByText('$30/hr')).toBeInTheDocument()
    expect(within(pricing).getByRole('list', { name: /accepted payment/i })).toBeInTheDocument()
    expect(within(contact).getByRole('link', { name: /discord/i })).toBeInTheDocument()
    expect(within(contact).getByRole('link', { name: /roblox/i })).toBeInTheDocument()
  })

  it('does not add Testimonials to the header nav', () => {
    render(<App />)

    expect(screen.queryByRole('link', { name: /testimonials/i })).not.toBeInTheDocument()
  })

  it('links each header tab to its section id', () => {
    render(<App />)

    for (const [label, hash] of [
      ['Home', '#home'],
      ['Work', '#work'],
      ['Stack', '#stack'],
      ['Pricing', '#pricing'],
      ['Contact', '#contact'],
    ]) {
      expect(screen.getByRole('link', { name: label })).toHaveAttribute('href', hash)
    }
  })

  it('marks the clicked tab active without unmounting any section content', async () => {
    siteConfig.showOtherWork = true
    const { container } = render(<App />)
    await screen.findAllByTestId('game-card')

    for (const label of ['Work', 'Stack', 'Pricing', 'Contact', 'Home']) {
      fireEvent.click(screen.getByRole('link', { name: label }))
      expect(screen.getByRole('link', { name: label })).toHaveClass('active')
      expect(screen.getAllByRole('link', { name: /^(Home|Work|Stack|Pricing|Contact)$/ }).filter((l) => l.classList.contains('active'))).toHaveLength(1)

      expect(container.querySelectorAll('main > section')).toHaveLength(7)
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('DemonLexe')
      expect(screen.getByRole('heading', { level: 2, name: /about me/i })).toBeInTheDocument()
      expect(screen.getAllByTestId('game-card')).toHaveLength(5)
      expect(screen.getByRole('heading', { level: 2, name: /pricing & payment/i })).toBeInTheDocument()
    }
  })

  describe('active tab follows scroll', () => {
    interface FakeObserver {
      callback: IntersectionObserverCallback
      options?: IntersectionObserverInit
      targets: Element[]
      disconnected: boolean
    }
    const observers: FakeObserver[] = []
    const original = globalThis.IntersectionObserver

    beforeEach(() => {
      observers.length = 0
      class FakeIntersectionObserver {
        record: FakeObserver
        constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
          this.record = { callback, options, targets: [], disconnected: false }
          observers.push(this.record)
        }
        observe(target: Element) {
          this.record.targets.push(target)
        }
        unobserve() {}
        disconnect() {
          this.record.disconnected = true
        }
        takeRecords() {
          return []
        }
      }
      globalThis.IntersectionObserver = FakeIntersectionObserver as unknown as typeof IntersectionObserver
    })

    afterEach(() => {
      globalThis.IntersectionObserver = original
    })

    it('observes the five sections and activates the one that intersects', () => {
      const { container } = render(<App />)

      expect(observers).toHaveLength(1)
      const [observer] = observers
      expect(observer.targets.map((t) => t.id)).toEqual(['home', 'work', 'stack', 'pricing', 'contact'])
      expect(observer.options?.rootMargin).toBe('-35% 0px -55% 0px')

      const stack = container.querySelector('#stack') as Element
      act(() => {
        observer.callback(
          [{ target: stack, isIntersecting: true } as IntersectionObserverEntry],
          {} as IntersectionObserver,
        )
      })
      expect(screen.getByRole('link', { name: 'Stack' })).toHaveClass('active')
      expect(screen.getByRole('link', { name: 'Home' })).not.toHaveClass('active')

      const work = container.querySelector('#work') as Element
      act(() => {
        observer.callback(
          [
            { target: stack, isIntersecting: false } as IntersectionObserverEntry,
            { target: work, isIntersecting: true } as IntersectionObserverEntry,
          ],
          {} as IntersectionObserver,
        )
      })
      expect(screen.getByRole('link', { name: 'Work' })).toHaveClass('active')
      expect(screen.getByRole('link', { name: 'Stack' })).not.toHaveClass('active')
    })

    it('ignores non-intersecting entries', () => {
      const { container } = render(<App />)

      act(() => {
        observers[0].callback(
          [
            {
              target: container.querySelector('#contact'),
              isIntersecting: false,
            } as unknown as IntersectionObserverEntry,
          ],
          {} as IntersectionObserver,
        )
      })
      expect(screen.getByRole('link', { name: 'Home' })).toHaveClass('active')
    })

    it('disconnects the observer on unmount', () => {
      const { unmount } = render(<App />)

      expect(observers[0].disconnected).toBe(false)
      unmount()
      expect(observers[0].disconnected).toBe(true)
    })
  })

  it('does not throw when IntersectionObserver is unavailable', () => {
    const original = globalThis.IntersectionObserver
    // @ts-expect-error simulate an environment without IntersectionObserver
    delete globalThis.IntersectionObserver
    try {
      expect(() => render(<App />)).not.toThrow()
    } finally {
      globalThis.IntersectionObserver = original
    }
  })
})
