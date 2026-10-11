// The bundle composition the installer relies on: installing the dsh-workpet
// bundle brings the default kitten, because DSH resolves the dependency
// closure of a selected bundle. A row a bundle inserts must therefore be the
// package itself or one of its `dependencies`, and no other package in this
// repository may insert the same row (duplicate row ids conflict).
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

const packages = join(dirname(fileURLToPath(import.meta.url)), '../..')
const manifest = name => JSON.parse(readFileSync(join(packages, name, 'package.json'), 'utf8'))

/** Rows of a one-level `- insert:` patch, as `{ id, name }`. */
function insertedRows(file) {
  const rows = []
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const id = /^\s*-\s+id:\s*(\S+)\s*$/.exec(line)
    if (id !== null) rows.push({ id: id[1], name: undefined })
    const name = /^\s+name:\s*'?([^'\s]+)'?\s*$/.exec(line)
    if (name !== null && rows.length > 0) rows[rows.length - 1].name = name[1]
  }
  return rows
}

describe('bundle composition', () => {
  const workpet = manifest('workpet')
  const cat = manifest('workpet-cat')

  it('dsh-workpet is the bundle and inserts itself and the default kitten', () => {
    assert.equal(workpet.dsh.bundle.patch, './cordis.patch.yml')
    assert.deepEqual(insertedRows(join(packages, 'workpet', 'cordis.patch.yml')), [
      { id: 'dsh-workpet', name: 'dsh-workpet' },
      { id: 'dsh-workpet-cat', name: 'dsh-workpet-cat' },
    ])
  })

  it('every inserted row is the bundle itself or one of its dependencies', () => {
    const allowed = new Set([workpet.name, ...Object.keys(workpet.dependencies ?? {})])
    for (const row of insertedRows(join(packages, 'workpet', 'cordis.patch.yml'))) {
      assert.ok(allowed.has(row.name), `${row.name} is neither dsh-workpet nor one of its dependencies`)
    }
    assert.equal(workpet.dependencies['dsh-workpet-cat'], 'workspace:^')
  })

  it('dsh-workpet-cat ships inside the bundle and is not a bundle itself', () => {
    assert.equal(cat.dsh.bundle, undefined)
    assert.equal(existsSync(join(packages, 'workpet-cat', 'cordis.patch.yml')), false)
    assert.ok(!cat.files.includes('cordis.patch.yml'))
    assert.deepEqual(cat.dsh.client.inject, ['dsh-workpet'])
  })
})
