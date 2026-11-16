import type { HtmlTagDescriptor, Plugin } from 'vite'
import type { SiteConfig } from '../src/config.ts'
import { yearsSince } from '../src/experience.ts'

const IMAGE_PATH = 'headshot.png'
const ROBOTS_FILENAME = 'robots.txt'
const SITEMAP_FILENAME = 'sitemap.xml'

function siteUrl(config: SiteConfig): string {
  return config.seo.siteUrl.replace(/\/*$/, '/')
}

function imageUrl(config: SiteConfig): string {
  return `${siteUrl(config)}${IMAGE_PATH}`
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

/** schema.org Person data, serialised safely for embedding in a <script> element. */
export function buildJsonLd(config: SiteConfig): string {
  const { seo, profile, robloxUserId } = config
  const knowsAbout = [...new Set([...profile.skills.map((skill) => skill.name), ...seo.keywords])]

  const data = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.username,
    url: siteUrl(config),
    image: imageUrl(config),
    description: seo.description,
    jobTitle: 'Roblox Developer',
    knowsAbout,
    sameAs: [`https://www.roblox.com/users/${robloxUserId}/profile`],
  }

  return JSON.stringify(data).replaceAll('<', '\\u003c')
}

export function buildSeoTags(config: SiteConfig): HtmlTagDescriptor[] {
  const { seo, profile } = config
  const url = siteUrl(config)
  const image = imageUrl(config)

  const meta = (
    key: 'name' | 'property',
    name: string,
    content: string,
  ): HtmlTagDescriptor => ({
    tag: 'meta',
    attrs: { [key]: name, content },
    injectTo: 'head',
  })

  return [
    { tag: 'title', children: seo.title, injectTo: 'head-prepend' },
    meta('name', 'description', seo.description),
    meta('name', 'keywords', seo.keywords.join(', ')),
    meta('name', 'author', profile.username),
    meta('name', 'robots', 'index, follow'),
    { tag: 'link', attrs: { rel: 'canonical', href: url }, injectTo: 'head' },

    meta('property', 'og:type', 'website'),
    meta('property', 'og:title', seo.title),
    meta('property', 'og:description', seo.description),
    meta('property', 'og:url', url),
    meta('property', 'og:locale', seo.locale),
    meta('property', 'og:site_name', profile.username),
    meta('property', 'og:image', image),

    meta('name', 'twitter:card', 'summary'),
    meta('name', 'twitter:title', seo.title),
    meta('name', 'twitter:description', seo.description),
    meta('name', 'twitter:image', image),

    {
      tag: 'script',
      attrs: { type: 'application/ld+json' },
      children: buildJsonLd(config),
      injectTo: 'head',
    },
  ]
}

export function buildRobotsTxt(config: SiteConfig): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl(config)}${SITEMAP_FILENAME}\n`
}

export function buildSitemapXml(config: SiteConfig): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    `  <url><loc>${escapeXml(siteUrl(config))}</loc></url>`,
    '</urlset>',
    '',
  ].join('\n')
}

/**
 * Injects title/meta/Open Graph/JSON-LD tags into index.html from `siteConfig`
 * (and fills `{{years}}` in the markup), and emits robots.txt and sitemap.xml on build.
 */
export function seoPlugin(config: SiteConfig): Plugin {
  return {
    name: 'seo',
    transformIndexHtml(html) {
      return {
        html: html.replaceAll('{{years}}', String(yearsSince(config.profile.careerStartYear))),
        tags: buildSeoTags(config),
      }
    },
    buildStart() {
      if (this.environment.mode !== 'build') return
      this.emitFile({
        type: 'asset',
        fileName: ROBOTS_FILENAME,
        source: buildRobotsTxt(config),
      })
      this.emitFile({
        type: 'asset',
        fileName: SITEMAP_FILENAME,
        source: buildSitemapXml(config),
      })
    },
  }
}
