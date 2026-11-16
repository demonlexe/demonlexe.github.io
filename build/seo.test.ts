import { describe, expect, it, vi } from 'vitest'
import type { SiteConfig } from '../src/config.ts'
import { siteConfig } from '../src/config.ts'
import {
  buildJsonLd,
  buildRobotsTxt,
  buildSeoTags,
  buildSitemapXml,
  seoPlugin,
} from './seo.ts'

type Tag = ReturnType<typeof buildSeoTags>[number]

const config: SiteConfig = {
  ...siteConfig,
  seo: {
    siteUrl: 'https://example.test/',
    title: 'Example Title',
    description: 'Example description.',
    keywords: ['alpha', 'beta', 'gamma'],
    locale: 'en_US',
  },
}

function findTag(tags: Tag[], tag: string, attr: string, value: string) {
  return tags.find((t) => t.tag === tag && t.attrs?.[attr] === value)
}

describe('buildSeoTags', () => {
  const tags = buildSeoTags(config)

  it('sets the document title', () => {
    expect(tags.find((t) => t.tag === 'title')?.children).toBe('Example Title')
  })

  it('sets description and a comma-separated keywords meta tag', () => {
    expect(findTag(tags, 'meta', 'name', 'description')?.attrs?.content).toBe(
      'Example description.',
    )
    expect(findTag(tags, 'meta', 'name', 'keywords')?.attrs?.content).toBe(
      'alpha, beta, gamma',
    )
  })

  it('sets the author and an indexable robots directive', () => {
    expect(findTag(tags, 'meta', 'name', 'author')?.attrs?.content).toBe(
      config.profile.username,
    )
    expect(findTag(tags, 'meta', 'name', 'robots')?.attrs?.content).toBe(
      'index, follow',
    )
  })

  it('links the absolute canonical url', () => {
    expect(findTag(tags, 'link', 'rel', 'canonical')?.attrs?.href).toBe(
      'https://example.test/',
    )
  })

  it('emits Open Graph tags with an absolute image url', () => {
    const og = (property: string) =>
      findTag(tags, 'meta', 'property', property)?.attrs?.content
    expect(og('og:type')).toBe('website')
    expect(og('og:title')).toBe('Example Title')
    expect(og('og:description')).toBe('Example description.')
    expect(og('og:url')).toBe('https://example.test/')
    expect(og('og:locale')).toBe('en_US')
    expect(og('og:site_name')).toBe(config.profile.username)
    expect(og('og:image')).toBe('https://example.test/headshot.png')
  })

  it('emits Twitter card tags', () => {
    const tw = (name: string) =>
      findTag(tags, 'meta', 'name', name)?.attrs?.content
    expect(tw('twitter:card')).toBe('summary')
    expect(tw('twitter:title')).toBe('Example Title')
    expect(tw('twitter:description')).toBe('Example description.')
    expect(tw('twitter:image')).toBe('https://example.test/headshot.png')
  })

  it('includes a JSON-LD script', () => {
    const script = findTag(tags, 'script', 'type', 'application/ld+json')
    expect(script).toBeDefined()
    expect(JSON.parse(script!.children as string)['@type']).toBe('Person')
  })

  it('injects every tag into the head', () => {
    expect(tags.every((t) => t.injectTo === 'head' || t.injectTo === 'head-prepend')).toBe(true)
  })

  it('normalises a siteUrl without a trailing slash', () => {
    const noSlash = buildSeoTags({
      ...config,
      seo: { ...config.seo, siteUrl: 'https://example.test' },
    })
    expect(findTag(noSlash, 'link', 'rel', 'canonical')?.attrs?.href).toBe(
      'https://example.test/',
    )
  })
})

describe('buildJsonLd', () => {
  const data = JSON.parse(buildJsonLd(config))

  it('describes the site owner as a Person', () => {
    expect(data['@context']).toBe('https://schema.org')
    expect(data['@type']).toBe('Person')
    expect(data.name).toBe(config.profile.username)
    expect(data.url).toBe('https://example.test/')
    expect(data.image).toBe('https://example.test/headshot.png')
    expect(data.description).toBe('Example description.')
    expect(data.jobTitle).toBe('Roblox Developer')
  })

  it('lists skills and keywords under knowsAbout without duplicates', () => {
    expect(data.knowsAbout).toEqual(
      expect.arrayContaining([...config.profile.skills.map((skill) => skill.name), 'alpha', 'beta', 'gamma']),
    )
    expect(new Set(data.knowsAbout).size).toBe(data.knowsAbout.length)
  })

  it('links the Roblox profile via sameAs', () => {
    expect(data.sameAs).toEqual([
      `https://www.roblox.com/users/${config.robloxUserId}/profile`,
    ])
  })

  it('escapes "<" so values cannot close the script element', () => {
    const json = buildJsonLd({
      ...config,
      seo: { ...config.seo, description: '</script><b>x' },
    })
    expect(json).not.toContain('</script>')
    expect(JSON.parse(json).description).toBe('</script><b>x')
  })
})

describe('buildRobotsTxt', () => {
  it('allows crawling and points at the sitemap', () => {
    expect(buildRobotsTxt(config)).toBe(
      'User-agent: *\nAllow: /\n\nSitemap: https://example.test/sitemap.xml\n',
    )
  })
})

describe('buildSitemapXml', () => {
  it('lists the canonical url', () => {
    const xml = buildSitemapXml(config)
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    expect(xml).toContain('<loc>https://example.test/</loc>')
  })

  it('escapes XML special characters in the url', () => {
    const xml = buildSitemapXml({
      ...config,
      seo: { ...config.seo, siteUrl: 'https://example.test/a&b/' },
    })
    expect(xml).toContain('<loc>https://example.test/a&amp;b/</loc>')
  })
})

describe('seoPlugin', () => {
  it('provides the SEO tags through transformIndexHtml', () => {
    const plugin = seoPlugin(config)
    const result = (plugin.transformIndexHtml as unknown as (html: string) => { tags: unknown })('<p></p>')
    expect(result.tags).toEqual(buildSeoTags(config))
  })

  it('fills the {{years}} placeholder in index.html from the career start year', () => {
    const plugin = seoPlugin({
      ...config,
      profile: { ...config.profile, careerStartYear: new Date().getFullYear() - 7 },
    })
    const result = (plugin.transformIndexHtml as unknown as (html: string) => { html: string })(
      '<p>{{years}}+ years, again {{years}}+</p>',
    )
    expect(result.html).toBe('<p>7+ years, again 7+</p>')
  })

  it('emits robots.txt and sitemap.xml on build', () => {
    const plugin = seoPlugin(config)
    const emitFile = vi.fn()
    const ctx = { emitFile, environment: { mode: 'build' } }
    ;(plugin.buildStart as (this: unknown) => void).call(ctx)

    expect(emitFile).toHaveBeenCalledWith({
      type: 'asset',
      fileName: 'robots.txt',
      source: buildRobotsTxt(config),
    })
    expect(emitFile).toHaveBeenCalledWith({
      type: 'asset',
      fileName: 'sitemap.xml',
      source: buildSitemapXml(config),
    })
  })

  it('emits nothing in dev', () => {
    const plugin = seoPlugin(config)
    const emitFile = vi.fn()
    const ctx = { emitFile, environment: { mode: 'dev' } }
    ;(plugin.buildStart as (this: unknown) => void).call(ctx)
    expect(emitFile).not.toHaveBeenCalled()
  })
})
