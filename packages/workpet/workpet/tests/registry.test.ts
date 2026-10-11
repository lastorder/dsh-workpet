import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { WorkpetSkin } from '../src/client/contract.ts'
import { WorkpetRegistry, type SelectionStore } from '../src/client/registry.ts'

function memoryStore(initial?: string): SelectionStore & { value: string | undefined } {
  return {
    value: initial,
    read() { return this.value },
    write(id) { this.value = id },
  }
}

const Figure = (): null => null
const skin = (id: string, order?: number): WorkpetSkin => ({ id, order, title: () => id, Figure })

describe('WorkpetRegistry', () => {
  it('orders skins by order, then id, and falls back to the first one', () => {
    const registry = new WorkpetRegistry(memoryStore())
    registry.register(skin('parrot', 10))
    registry.register(skin('cat', 0))
    registry.register(skin('axolotl', 10))
    const snapshot = registry.getSnapshot()
    assert.deepEqual(snapshot.skins.map(s => s.id), ['cat', 'axolotl', 'parrot'])
    assert.equal(snapshot.current?.id, 'cat')
    assert.equal(snapshot.selectedId, undefined)
  })

  it('applies a stored selection once that skin registers', () => {
    const registry = new WorkpetRegistry(memoryStore('parrot'))
    registry.register(skin('cat', 0))
    assert.equal(registry.getSnapshot().current?.id, 'cat')
    const dispose = registry.register(skin('parrot', 10))
    assert.equal(registry.getSnapshot().current?.id, 'parrot')
    dispose()
    assert.equal(registry.getSnapshot().current?.id, 'cat')
    assert.equal(registry.getSnapshot().selectedId, 'parrot')
  })

  it('persists selection and notifies subscribers with a new snapshot', () => {
    const store = memoryStore()
    const registry = new WorkpetRegistry(store)
    registry.register(skin('cat'))
    registry.register(skin('parrot', 1))
    const before = registry.getSnapshot()
    let calls = 0
    const unsubscribe = registry.subscribe(() => { calls += 1 })
    registry.select('parrot')
    registry.select('parrot')
    assert.equal(calls, 1)
    assert.equal(store.value, 'parrot')
    assert.notEqual(registry.getSnapshot(), before)
    assert.equal(registry.getSnapshot().current?.id, 'parrot')
    unsubscribe()
    registry.select('cat')
    assert.equal(calls, 1)
  })

  it('adopts a selection from another tab without writing it back', () => {
    const store = memoryStore('cat')
    const registry = new WorkpetRegistry(store)
    registry.register(skin('cat'))
    registry.register(skin('parrot', 1))
    store.value = 'written-elsewhere'
    registry.adopt('parrot')
    assert.equal(registry.getSnapshot().current?.id, 'parrot')
    assert.equal(store.value, 'written-elsewhere')
  })

  it('rejects duplicate and malformed ids, and disposers are idempotent', () => {
    const registry = new WorkpetRegistry(memoryStore())
    const dispose = registry.register(skin('cat'))
    assert.throws(() => registry.register(skin('cat')), /already registered/)
    assert.throws(() => registry.register(skin('Bad Id')), /invalid skin id/)
    dispose()
    const again = registry.register(skin('cat'))
    dispose()
    assert.equal(registry.getSnapshot().skins.length, 1)
    again()
    assert.equal(registry.getSnapshot().skins.length, 0)
    assert.equal(registry.getSnapshot().current, undefined)
  })
})
