/**
 * Where each pet stands on screen. Every skin keeps its own position, stored
 * by skin id; a pet that was never moved takes the next free slot to the
 * left of the default corner. Pure: storage and the viewport are passed in.
 */

/** Distance from the window's right and bottom edges, in CSS pixels. */
export interface Position { readonly right: number; readonly bottom: number }

/** Window size in CSS pixels. */
export interface Viewport { readonly width: number; readonly height: number }

/** The part of `Storage` this module uses. */
export interface PositionStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

/** Position of the first pet before the user moves it. */
export const DEFAULT_CORNER: Position = { right: 28, bottom: 96 }
/** Horizontal distance between the default slots of neighboring pets: wide enough that their status bubbles do not overlap. */
export const PET_SPACING = 150
/** Key of the single position stored before every skin had its own. */
export const LEGACY_POSITION_KEY = 'dsh-workpet:position'

const PET_BOX = { width: 120, height: 104 } as const
const MARGIN = 4

/**
 * @param skinId - skin id.
 * @returns the `localStorage` key of that pet's position.
 */
export function positionKey(skinId: string): string {
  return `${LEGACY_POSITION_KEY}:${skinId}`
}

/**
 * Keep the whole pet inside the window.
 * @param position - wanted position.
 * @param viewport - window size.
 * @returns the nearest position that keeps the pet visible.
 */
export function clampPosition(position: Position, viewport: Viewport): Position {
  return {
    right: Math.min(Math.max(position.right, MARGIN), Math.max(MARGIN, viewport.width - PET_BOX.width - MARGIN)),
    bottom: Math.min(Math.max(position.bottom, MARGIN), Math.max(MARGIN, viewport.height - PET_BOX.height - MARGIN)),
  }
}

/**
 * @param index - the pet's place in skin order.
 * @param viewport - window size.
 * @returns the default slot: the corner for the first pet, then leftwards.
 */
export function defaultPosition(index: number, viewport: Viewport): Position {
  return clampPosition({ right: DEFAULT_CORNER.right + index * PET_SPACING, bottom: DEFAULT_CORNER.bottom }, viewport)
}

function readStored(storage: PositionStorage | undefined, key: string): Position | undefined {
  try {
    const raw = storage?.getItem(key)
    if (raw == null) return undefined
    const parsed = JSON.parse(raw) as Partial<Position> | null
    if (typeof parsed?.right === 'number' && typeof parsed.bottom === 'number' && Number.isFinite(parsed.right) && Number.isFinite(parsed.bottom)) {
      return { right: parsed.right, bottom: parsed.bottom }
    }
  } catch (error) {
    // Storage disabled or a corrupt entry: fall back to the default slot.
    void error
  }
  return undefined
}

/**
 * The pet's own stored position; for the first pet, the position stored
 * before positions were kept per skin; otherwise its default slot.
 * @param storage - `localStorage`, or undefined when unavailable.
 * @param skinId - skin id.
 * @param index - the pet's place in skin order.
 * @param viewport - window size.
 * @returns a position inside the window.
 */
export function loadPosition(storage: PositionStorage | undefined, skinId: string, index: number, viewport: Viewport): Position {
  const stored = readStored(storage, positionKey(skinId)) ?? (index === 0 ? readStored(storage, LEGACY_POSITION_KEY) : undefined)
  return stored === undefined ? defaultPosition(index, viewport) : clampPosition(stored, viewport)
}

/**
 * @param storage - `localStorage`, or undefined when unavailable.
 * @param skinId - skin id.
 * @param position - position to keep; a storage failure keeps it for this page only.
 */
export function savePosition(storage: PositionStorage | undefined, skinId: string, position: Position): void {
  try {
    storage?.setItem(positionKey(skinId), JSON.stringify({ right: position.right, bottom: position.bottom }))
  } catch (error) {
    // Quota or privacy mode: the position lasts for this page only.
    void error
  }
}
