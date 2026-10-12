import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { WorkpetSkin } from '../src/client/contract.ts'
import { WorkpetRegistry } from '../src/client/registry.ts'

const Figure = (): null => null
const skin = (id: string, order?: number): WorkpetSkin => ({ id, order, title: () => id, Figure })

describe('WorkpetRegistry', () => {
  it('lists every registered skin by order, then id', () => {
    const registry = new WorkpetRegistry()
    assert.deepEqual(registry.getSnapshot(), { skins: [] })
    registry.register(skin('parrot', 10))
    registry.register(skin('cat', 0))
    registry.register(skin('axolotl', 10))
    const snapshot = registry.getSnapshot()
    assert.deepEqual(snapshot.skins.map(s => s.id), ['cat', 'axolotl', 'parrot'])
    assert.deepEqual(Object.keys(snapshot), ['skins'])
  })

  it('notifies subscribers with a new snapshot on registration and removal', () => {
    const registry = new WorkpetRegistry()
    let calls = 0
    const unsubscribe = registry.subscribe(() => { calls += 1 })
    const before = registry.getSnapshot()
    const dispose = registry.register(skin('cat'))
    assert.equal(calls, 1)
    const registered = registry.getSnapshot()
    assert.notEqual(registered, before)
    dispose()
    assert.equal(calls, 2)
    assert.notEqual(registry.getSnapshot(), registered)
    assert.equal(registry.getSnapshot().skins.length, 0)
    unsubscribe()
    registry.register(skin('parrot'))
    assert.equal(calls, 2)
  })

  it('rejects duplicate and malformed ids, and disposers are idempotent', () => {
    const registry = new WorkpetRegistry()
    const dispose = registry.register(skin('cat'))
    assert.throws(() => registry.register(skin('cat')), /already registered/)
    assert.throws(() => registry.register(skin('Bad Id')), /invalid skin id/)
    dispose()
    const again = registry.register(skin('cat'))
    dispose()
    assert.equal(registry.getSnapshot().skins.length, 1)
    again()
    assert.equal(registry.getSnapshot().skins.length, 0)
  })
})
