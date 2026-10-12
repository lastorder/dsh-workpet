import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { absolutizeLinks, npmReadmes, pinManifest, PUBLISHED, README_FROM_ROOT, relativeLinks } from './release.mjs'

const versions = new Map([['dsh-workpet-cat', '0.1.0'], ['dsh-workpet', '0.1.0']])

describe('pinManifest', () => {
  it('rewrites workspace ranges toward published packages into npm ranges', () => {
    const manifest = {
      name: 'dsh-workpet',
      dependencies: { 'dsh-workpet-cat': 'workspace:^', other: '^1.0.0' },
      peerDependencies: { 'dsh-workpet-cat': 'workspace:~' },
      devDependencies: { 'dsh-workpet-cat': 'workspace:*' },
      optionalDependencies: { 'dsh-workpet-cat': 'workspace:>=0.1.0' },
    }
    const { manifest: pinned, pinned: lines, problems } = pinManifest(manifest, versions)
    assert.deepEqual(problems, [])
    assert.equal(pinned.dependencies['dsh-workpet-cat'], '^0.1.0')
    assert.equal(pinned.dependencies.other, '^1.0.0')
    assert.equal(pinned.peerDependencies['dsh-workpet-cat'], '~0.1.0')
    assert.equal(pinned.devDependencies['dsh-workpet-cat'], '0.1.0')
    assert.equal(pinned.optionalDependencies['dsh-workpet-cat'], '>=0.1.0')
    assert.equal(lines.length, 4)
    assert.equal(manifest.dependencies['dsh-workpet-cat'], 'workspace:^', 'the input is not modified')
  })

  it('reports a workspace range toward a package this repository does not publish', () => {
    const { problems } = pinManifest({ name: 'dsh-workpet', dependencies: { 'private-helper': 'workspace:^' } }, versions)
    assert.equal(problems.length, 1)
    assert.match(problems[0], /private-helper is not published/)
  })

  it('leaves a manifest without workspace ranges untouched', () => {
    const { pinned, problems } = pinManifest({ name: 'dsh-workpet-cat', peerDependencies: { react: '^18.2.0' } }, versions)
    assert.deepEqual([pinned, problems], [[], []])
  })
})

describe('PUBLISHED', () => {
  it('publishes the default kitten before the capability that depends on it', () => {
    assert.deepEqual(PUBLISHED, ['packages/workpet/workpet-cat', 'packages/workpet/workpet'])
  })
})

describe('npm READMEs', () => {
  const base = 'https://github.com/lastorder/dsh-workpet/blob/v1.2.3/'

  it('makes relative links absolute and leaves anchors, web, and mail links alone', () => {
    const markdown = '[zh](README.zh.md) [arch](docs/architecture.md#the-interface) [up](../x.md) [a](#install) [w](https://example.com) [m](mailto:a@b.c)'
    const rewritten = absolutizeLinks(markdown, `${base}packages/workpet/workpet-cat/`)
    assert.equal(rewritten, `[zh](${base}packages/workpet/workpet-cat/README.zh.md) [arch](${base}packages/workpet/workpet-cat/docs/architecture.md#the-interface) [up](${base}packages/workpet/x.md) [a](#install) [w](https://example.com) [m](mailto:a@b.c)`)
    assert.deepEqual(relativeLinks(rewritten), [])
    assert.deepEqual(relativeLinks(markdown), ['README.zh.md', 'docs/architecture.md#the-interface', '../x.md'])
  })

  it('points images at the raw files and links at the GitHub pages', () => {
    const raw = 'https://raw.githubusercontent.com/lastorder/dsh-workpet/v1.2.3/'
    const markdown = '![pets](docs/images/a.png) [doc](docs/a.md) <img src="docs/images/b.png" width="400" alt="b"> <img src="https://x.y/c.png">'
    const rewritten = absolutizeLinks(markdown, base, raw)
    assert.equal(rewritten, `![pets](${raw}docs/images/a.png) [doc](${base}docs/a.md) <img src="${raw}docs/images/b.png" width="400" alt="b"> <img src="https://x.y/c.png">`)
    assert.deepEqual(relativeLinks(markdown), ['docs/images/a.png', 'docs/a.md', 'docs/images/b.png'])
    assert.deepEqual(relativeLinks(rewritten), [])
  })

  it('gives dsh-workpet the repository root README, with links resolved from the root', () => {
    assert.ok(README_FROM_ROOT.has('packages/workpet/workpet'))
    const files = [...npmReadmes('packages/workpet/workpet', 'v1.2.3')]
    const [file, content] = files.find(([name]) => name.endsWith('packages/workpet/workpet/README.md'))
    assert.ok(file.endsWith('packages/workpet/workpet/README.md'))
    const rootReadme = readFileSync(new URL('../README.md', import.meta.url), 'utf8')
    assert.equal(content.split('\n', 1)[0], rootReadme.split('\n', 1)[0])
    assert.match(content, /\]\(https:\/\/github\.com\/lastorder\/dsh-workpet\/blob\/v1\.2\.3\/docs\/architecture\.md\)/)
    assert.deepEqual(relativeLinks(content), [])
    assert.equal(files.length, 2, 'README.md and README.zh.md')
  })

  it('keeps the kitten package README, with links resolved from its own directory', () => {
    const [, content] = [...npmReadmes('packages/workpet/workpet-cat', 'main')][0]
    assert.match(content, /^# dsh-workpet-cat/)
    assert.match(content, /\(https:\/\/github\.com\/lastorder\/dsh-workpet\/blob\/main\/packages\/workpet\/workpet-cat\/README\.zh\.md\)/)
  })
})
