/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// Read from disk: vitest's CSS pipeline blanks `?raw` CSS imports.
const rawCss = readFileSync(resolve(import.meta.dirname, 'index.css'), 'utf8')
const mainSource = readFileSync(resolve(import.meta.dirname, 'main.tsx'), 'utf8')

const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, '')

function rulesFor(selector: string): string[] {
  const rules: string[] = []
  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectors = match[1].split(',').map((s: string) => s.trim())
    if (selectors.includes(selector)) {
      rules.push(match[2])
    }
  }
  return rules
}

describe('typography', () => {
  it('loads the display font (Chakra Petch) in the app entry', () => {
    expect(mainSource).toMatch(/@fontsource\/chakra-petch/)
  })

  it('defines a display font variable that starts with Chakra Petch', () => {
    const rootRules = rulesFor(':root').join('\n')
    expect(rootRules).toMatch(/--font-display:\s*['"]Chakra Petch/)
  })

  it.each(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', '.navbar-brand', '.nav-link'])(
    'applies the display font to %s',
    (selector) => {
      const declarations = rulesFor(selector).join('\n')
      expect(declarations).toMatch(/font-family:\s*var\(--font-display\)/)
    },
  )

  it('does not apply the display font to the body so text uses the regular font', () => {
    const bodyDeclarations = rulesFor('body').join('\n')
    expect(bodyDeclarations).not.toMatch(/--font-display/)
    expect(bodyDeclarations).not.toMatch(/Chakra Petch/)
  })
})

const toRgb = (hex: string): number[] => {
  const h = hex.length === 4 ? hex.slice(1).replace(/./g, (c) => c + c) : hex.slice(1)
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
}

const gradientColors = (variable: string): number[][] => {
  const root = rulesFor(':root').join('\n')
  const match = root.match(new RegExp(`${variable}:\\s*linear-gradient\\(([^;]*)\\);`))
  expect(match).not.toBeNull()
  expect(match![1]).toMatch(/^\s*90deg/)
  return [...match![1].matchAll(/#[0-9a-fA-F]{3,6}\b/g)].map((m) => toRgb(m[0]))
}

const isPurple = ([r, g, b]: number[]) => r > g + 40 && b > g + 40 && r > 80
const isBlue = ([r, g, b]: number[]) => b > r + 40 && b > g + 40
const isWhite = (color: number[]) => color.every((c) => c === 255)

describe('brand gradient (header)', () => {
  it('goes from purple on the left to blue on the right', () => {
    const colors = gradientColors('--brand-gradient')
    expect(colors).toHaveLength(2)
    expect(isPurple(colors[0])).toBe(true)
    expect(isBlue(colors[1])).toBe(true)
  })

  it('has no white or near-black stop', () => {
    for (const color of gradientColors('--brand-gradient')) {
      expect(isWhite(color)).toBe(false)
      expect(Math.max(...color)).toBeGreaterThan(100)
    }
  })

  it('layers the pattern over the gradient as the header background', () => {
    const declarations = rulesFor('.site-header').join('\n')
    expect(declarations).toMatch(
      /background-image:\s*var\(--header-pattern\)\s*,\s*var\(--brand-gradient\)/,
    )
  })

  it('uses a solid footer background in the same dark purple the header starts with', () => {
    const declarations = rulesFor('.site-footer').join('\n')
    expect(declarations).not.toMatch(/gradient/)
    const match = declarations.match(/background-color:\s*(#[0-9a-fA-F]{6})\b/)
    expect(match).not.toBeNull()
    const [headerPurple] = gradientColors('--brand-gradient')
    expect(toRgb(match![1])).toEqual(headerPurple)
  })

  it('keeps the nav tabs light, since the whole header is dark', () => {
    expect(css).not.toMatch(/\.site-header[^{]*\.nav-link[^{]*\{[^}]*color:\s*#111/)
    expect(css).not.toMatch(/\.site-header[^{]*\.navbar-toggler[^{]*\{[^}]*invert/)
  })
})

describe('page background (parchment)', () => {
  const pageBg = () => {
    const match = rulesFor(':root').join('\n').match(/--page-bg:\s*(#[0-9a-fA-F]{6})\s*;/)
    expect(match).not.toBeNull()
    return toRgb(match![1])
  }

  it('defines --page-bg as a warm cream color, not white', () => {
    const [r, g, b] = pageBg()
    expect(isWhite([r, g, b])).toBe(false)
    expect(r).toBeGreaterThanOrEqual(g)
    expect(g).toBeGreaterThanOrEqual(b)
    expect(r).toBeGreaterThanOrEqual(225)
    expect(b).toBeLessThanOrEqual(235)
    expect(r - b).toBeGreaterThanOrEqual(12)
  })

  it('uses --page-bg as the body background', () => {
    const declarations = rulesFor('body').join('\n')
    expect(declarations).toMatch(/background-color:\s*var\(--page-bg\)/)
  })

  it('overrides the Bootstrap body background variable with --page-bg', () => {
    const declarations = [...rulesFor('body'), ...rulesFor(':root')].join('\n')
    expect(declarations).toMatch(/--bs-body-bg:\s*var\(--page-bg\)/)
  })
})

describe('divider gradient', () => {
  it('goes purple, then blue, then fades out to transparent', () => {
    const colors = gradientColors('--divider-gradient')
    expect(colors).toHaveLength(2)
    expect(isPurple(colors[0])).toBe(true)
    expect(isBlue(colors[1])).toBe(true)

    const root = rulesFor(':root').join('\n')
    const stops = root.match(/--divider-gradient:\s*linear-gradient\(([^;]*)\);/)![1]
    expect(stops.trim()).toMatch(/,\s*(transparent|rgba\([^)]*,\s*0\))\s*$/)
  })

  it('is the divider background', () => {
    const declarations = rulesFor('.section-divider').join('\n')
    expect(declarations).toMatch(/background(-image)?:\s*var\(--divider-gradient\)/)
  })
})

describe('smooth in-page scrolling', () => {
  it('offsets anchor scrolling by the sticky header height', () => {
    const declarations = rulesFor('html').join('\n')
    expect(declarations).toMatch(/scroll-padding-top:\s*[\d.]+(rem|px)/)
  })

  it('enables smooth scrolling only when reduced motion is not requested', () => {
    const media = css.match(
      /@media\s*\(prefers-reduced-motion:\s*no-preference\)\s*\{([\s\S]*?\})\s*\}/,
    )
    expect(media).not.toBeNull()
    expect(media![1]).toMatch(/html\s*\{[^}]*scroll-behavior:\s*smooth/)
    // Not applied unconditionally.
    expect(css.replace(media![0], '')).not.toMatch(/scroll-behavior:\s*smooth/)
  })
})

describe('skill lozenges', () => {
  const background = (selector: string) => {
    const declarations = rulesFor(selector).join('\n')
    const match = declarations.match(/background-color:\s*(#[0-9a-fA-F]{6})\b/)
    expect(match).not.toBeNull()
    return toRgb(match![1])
  }

  it('programming skills are purple', () => {
    expect(isPurple(background('.skill-lozenge--programming'))).toBe(true)
  })

  it('programming skills match the purple at the start of the header gradient', () => {
    const [headerPurple] = gradientColors('--brand-gradient')
    expect(background('.skill-lozenge--programming')).toEqual(headerPurple)
  })

  it('programming skills use a darker purple than the original #7c3aed', () => {
    const sum = (rgb: number[]) => rgb.reduce((a, b) => a + b, 0)
    expect(sum(background('.skill-lozenge--programming'))).toBeLessThan(
      sum(toRgb('#7c3aed')) - 60,
    )
  })

  it('other skills are the blue at the end of the header gradient', () => {
    const headerBlue = gradientColors('--brand-gradient')[1]
    expect(isBlue(background('.skill-lozenge--other'))).toBe(true)
    expect(background('.skill-lozenge--other')).toEqual(headerBlue)
  })

  it('use white text', () => {
    expect(rulesFor('.skill-lozenge').join('\n')).toMatch(/color:\s*#fff(fff)?\b/)
  })
})

describe('section icons', () => {
  it('are filled with the header gradient through a mask', () => {
    const declarations = rulesFor('.section-icon').join('\n')
    expect(declarations).toMatch(/background(-image)?:\s*var\(--brand-gradient\)/)
    expect(declarations).toMatch(/mask:/)
  })

  it.each(['about', 'work', 'testimonials', 'stack', 'pricing', 'contact'])(
    'define an svg icon for %s',
    (kind) => {
      const declarations = rulesFor(`.section-icon--${kind}`).join('\n')
      expect(declarations).toMatch(/data:image\/svg\+xml/)
    },
  )
})

// The motion rules live in the last reduced-motion guard, so they only apply when motion is OK.
const MOTION_GUARD = '@media (prefers-reduced-motion: no-preference)'
const guardedCss = css.slice(css.lastIndexOf(MOTION_GUARD))
const unguardedCss = css.slice(0, css.lastIndexOf(MOTION_GUARD))

describe('home avatar bobbing', () => {
  it('defines a keyframe animation that moves the avatar vertically', () => {
    expect(css).toMatch(/@keyframes\s+avatar-bob\s*\{[^]*translateY\(/)
  })

  it('bobs slowly (3s or longer), smoothly and forever', () => {
    const animation = guardedCss.match(/\.headshot--bobbing\s*\{[^}]*animation:([^;]*);/)
    expect(animation).not.toBeNull()
    expect(animation![1]).toMatch(/avatar-bob/)
    expect(animation![1]).toMatch(/ease-in-out/)
    expect(animation![1]).toMatch(/infinite/)
    const seconds = Number(animation![1].match(/(\d+(?:\.\d+)?)s\b/)![1])
    expect(seconds).toBeGreaterThanOrEqual(3)
  })

  it('only animates when reduced motion is not requested', () => {
    expect(unguardedCss).not.toMatch(/animation:/)
  })
})

describe('skill lozenge hover', () => {
  it('grows when hovered', () => {
    const hover = guardedCss.match(/\.skill-lozenge:hover\s*\{([^}]*)\}/)
    expect(hover).not.toBeNull()
    const scale = hover![1].match(/transform:\s*scale\((\d+(?:\.\d+)?)\)/)
    expect(scale).not.toBeNull()
    expect(Number(scale![1])).toBeGreaterThan(1)
  })

  it('animates the transform on the resting state, so it shrinks back smoothly when hover ends', () => {
    const base = guardedCss.match(/\.skill-lozenge\s*\{([^}]*)\}/)
    expect(base).not.toBeNull()
    const transition = base![1].match(/transition:([^;]*);/)
    expect(transition).not.toBeNull()
    expect(transition![1]).toMatch(/transform\s+\d/)
  })

  it('only moves when reduced motion is not requested', () => {
    expect(unguardedCss).not.toMatch(/\.skill-lozenge:hover/)
    expect(unguardedCss).not.toMatch(/\.skill-lozenge[^{]*\{[^}]*transition:/)
  })
})

describe('game card hover', () => {
  // GameGrid: `g-4` = 1.5rem gutter. Widest card is a single column in a 540px container.
  const GUTTER_PX = 24
  const WIDEST_CARD_PX = 540 - GUTTER_PX
  const scaleOf = () => {
    const hover = guardedCss.match(/\.game-grid__item:hover\s*\{([^}]*)\}/)
    expect(hover).not.toBeNull()
    const scale = hover![1].match(/transform:\s*scale\((\d+(?:\.\d+)?)\)/)
    expect(scale).not.toBeNull()
    return Number(scale![1])
  }

  it('grows the card (with its rank badge) when hovered', () => {
    expect(scaleOf()).toBeGreaterThan(1)
  })

  it('grows in place with a transform, so nothing else is pushed around', () => {
    const hover = guardedCss.match(/\.game-grid__item:hover\s*\{([^}]*)\}/)![1]
    expect(hover).not.toMatch(/\b(width|height|margin|padding|top|left|right|bottom)\s*:/)
  })

  it('grows less than the gutter, so it can never overlap a neighbouring card or the screen edge', () => {
    const growthPerSide = ((scaleOf() - 1) * WIDEST_CARD_PX) / 2
    // Half a gutter on each side: also the margin between a card and the viewport edge on mobile.
    expect(growthPerSide).toBeLessThan(GUTTER_PX / 2)
  })

  it('animates the transform on the resting state so it shrinks back smoothly', () => {
    const base = guardedCss.match(/\.game-grid__item\s*\{([^}]*)\}/)
    expect(base).not.toBeNull()
    expect(base![1].match(/transition:([^;]*);/)![1]).toMatch(/transform\s+\d/)
  })

  it('only moves when reduced motion is not requested', () => {
    expect(unguardedCss).not.toMatch(/\.game-grid__item:hover/)
    expect(unguardedCss).not.toMatch(/\.game-grid__item[^{]*\{[^}]*transition:/)
  })
})

describe('home username vfx', () => {
  it('fills the username with a gradient clipped to the text', () => {
    const declarations = rulesFor('.username-vfx').join('\n')
    expect(declarations).toMatch(/background-image:\s*linear-gradient/)
    expect(declarations).toMatch(/background-clip:\s*text/)
    expect(declarations).toMatch(/color:\s*transparent/)
  })

  it('shimmers the gradient and pulses a glow, only when motion is allowed', () => {
    expect(css).toMatch(/@keyframes\s+username-shimmer\s*\{[^]*background-position/)
    expect(css).toMatch(/@keyframes\s+username-glow\s*\{[^]*drop-shadow\(/)
    const animation = guardedCss.match(/\.username-vfx\s*\{[^}]*animation:([^;]*);/)
    expect(animation).not.toBeNull()
    expect(animation![1]).toMatch(/username-shimmer/)
    expect(animation![1]).toMatch(/username-glow/)
  })
})
