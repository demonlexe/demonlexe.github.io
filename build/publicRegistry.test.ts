// @vitest-environment node
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(import.meta.dirname, '..')
const PUBLIC_REGISTRY = 'https://registry.npmjs.org/'

describe('public npm registry only', () => {
  it('package-lock.json resolves every package from the public npm registry', () => {
    const lock = JSON.parse(readFileSync(resolve(root, 'package-lock.json'), 'utf8')) as {
      packages: Record<string, { resolved?: string }>
    }

    const offenders = Object.entries(lock.packages)
      .filter(([, pkg]) => pkg.resolved !== undefined && !pkg.resolved.startsWith(PUBLIC_REGISTRY))
      .map(([name, pkg]) => `${name} -> ${pkg.resolved}`)

    expect(offenders).toEqual([])
  })

  it('package.json does not depend on Atlassian-scoped packages', () => {
    const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as Record<
      string,
      Record<string, string> | undefined
    >
    const names = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']
      .flatMap((field) => Object.keys(pkg[field] ?? {}))
      .filter((name) => /^@atlassian(?:-|\/)|^@atlaskit\//.test(name))

    expect(names).toEqual([])
  })

  it('.npmrc pins the public npm registry', () => {
    const npmrc = readFileSync(resolve(root, '.npmrc'), 'utf8')

    expect(npmrc).toMatch(/^registry=https:\/\/registry\.npmjs\.org\/?$/m)
  })
})
