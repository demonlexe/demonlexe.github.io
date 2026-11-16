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
  it('goes purple, then blue, then white', () => {
    const colors = gradientColors('--divider-gradient')
    expect(colors).toHaveLength(3)
    expect(isPurple(colors[0])).toBe(true)
    expect(isBlue(colors[1])).toBe(true)
    expect(isWhite(colors[2])).toBe(true)
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
  it('are purple', () => {
    const declarations = rulesFor('.skill-lozenge').join('\n')
    const match = declarations.match(/background-color:\s*(#[0-9a-fA-F]{6})\b/)
    expect(match).not.toBeNull()
    expect(isPurple(toRgb(match![1]))).toBe(true)
  })

  it('match the purple at the start of the header gradient', () => {
    const declarations = rulesFor('.skill-lozenge').join('\n')
    const lozenge = toRgb(declarations.match(/background-color:\s*(#[0-9a-fA-F]{6})\b/)![1])
    const [headerPurple] = gradientColors('--brand-gradient')
    expect(lozenge).toEqual(headerPurple)
  })

  it('use a darker purple than the original #7c3aed', () => {
    const declarations = rulesFor('.skill-lozenge').join('\n')
    const lozenge = toRgb(declarations.match(/background-color:\s*(#[0-9a-fA-F]{6})\b/)![1])
    const sum = (rgb: number[]) => rgb.reduce((a, b) => a + b, 0)
    expect(sum(lozenge)).toBeLessThan(sum(toRgb('#7c3aed')) - 60)
  })
})
