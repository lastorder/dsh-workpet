import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { pinManifest, PUBLISHED } from './release.mjs'

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
