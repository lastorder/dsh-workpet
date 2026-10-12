import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  clampPosition, DEFAULT_CORNER, defaultPosition, LEGACY_POSITION_KEY, loadPosition, PET_SPACING, positionKey, savePosition, type PositionStorage,
} from '../src/client/placement.ts'

const viewport = { width: 1280, height: 800 }

function memoryStorage(entries: Record<string, string> = {}): PositionStorage & { entries: Record<string, string> } {
  return {
    entries,
    getItem(key) { return key in this.entries ? this.entries[key] ?? null : null },
    setItem(key, value) { this.entries[key] = value },
  }
}

const throwing: PositionStorage = {
  getItem() { throw new Error('blocked') },
  setItem() { throw new Error('quota') },
}

describe('placement', () => {
  it('lines pets up leftwards from the default corner', () => {
    assert.deepEqual(defaultPosition(0, viewport), DEFAULT_CORNER)
    assert.deepEqual(defaultPosition(1, viewport), { right: DEFAULT_CORNER.right + PET_SPACING, bottom: DEFAULT_CORNER.bottom })
    assert.deepEqual(defaultPosition(2, viewport), { right: DEFAULT_CORNER.right + 2 * PET_SPACING, bottom: DEFAULT_CORNER.bottom })
  })

  it('keeps the whole pet inside the window', () => {
    assert.deepEqual(clampPosition({ right: -50, bottom: 9999 }, viewport), { right: 4, bottom: 800 - 108 })
    assert.deepEqual(clampPosition({ right: 9999, bottom: -1 }, viewport), { right: 1280 - 124, bottom: 4 })
    assert.deepEqual(clampPosition({ right: 50, bottom: 50 }, { width: 60, height: 60 }), { right: 4, bottom: 4 })
    assert.deepEqual(defaultPosition(20, viewport), { right: 1280 - 124, bottom: DEFAULT_CORNER.bottom })
  })

  it('stores each pet under its own key', () => {
    const storage = memoryStorage()
    savePosition(storage, 'cat', { right: 300, bottom: 200 })
    savePosition(storage, 'cockatiel', { right: 500, bottom: 120 })
    assert.equal(positionKey('cat'), 'dsh-workpet:position:cat')
    assert.deepEqual(loadPosition(storage, 'cat', 0, viewport), { right: 300, bottom: 200 })
    assert.deepEqual(loadPosition(storage, 'cockatiel', 1, viewport), { right: 500, bottom: 120 })
    assert.deepEqual(loadPosition(storage, 'axolotl', 2, viewport), defaultPosition(2, viewport))
  })

  it('reads the position stored before per-pet keys only for the first pet', () => {
    const storage = memoryStorage({ [LEGACY_POSITION_KEY]: JSON.stringify({ right: 400, bottom: 300 }) })
    assert.deepEqual(loadPosition(storage, 'cat', 0, viewport), { right: 400, bottom: 300 })
    assert.deepEqual(loadPosition(storage, 'cockatiel', 1, viewport), defaultPosition(1, viewport))
    storage.setItem(positionKey('cat'), JSON.stringify({ right: 40, bottom: 40 }))
    assert.deepEqual(loadPosition(storage, 'cat', 0, viewport), { right: 40, bottom: 40 })
  })

  it('falls back to the default slot for corrupt entries and unavailable storage', () => {
    const storage = memoryStorage({ [positionKey('cat')]: '{not json', [positionKey('cockatiel')]: '{"right":"1","bottom":2}' })
    assert.deepEqual(loadPosition(storage, 'cat', 0, viewport), defaultPosition(0, viewport))
    assert.deepEqual(loadPosition(storage, 'cockatiel', 1, viewport), defaultPosition(1, viewport))
    assert.deepEqual(loadPosition(throwing, 'cat', 0, viewport), defaultPosition(0, viewport))
    assert.deepEqual(loadPosition(undefined, 'cat', 1, viewport), defaultPosition(1, viewport))
    assert.doesNotThrow(() => savePosition(throwing, 'cat', DEFAULT_CORNER))
    assert.doesNotThrow(() => savePosition(undefined, 'cat', DEFAULT_CORNER))
  })

  it('clamps a stored position into a smaller window', () => {
    const storage = memoryStorage({ [positionKey('cat')]: JSON.stringify({ right: 1100, bottom: 700 }) })
    assert.deepEqual(loadPosition(storage, 'cat', 0, { width: 800, height: 600 }), { right: 800 - 124, bottom: 600 - 108 })
  })
})
