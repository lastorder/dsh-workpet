/**
 * `WorkpetRegistry`, the concrete registry behind `ctx.workpet`: registered
 * skins plus the user's selection, published as one immutable snapshot.
 */
import type { WorkpetService, WorkpetSkin, WorkpetSnapshot } from './contract.ts'

/** Where the user's skin selection lives between page loads. */
export interface SelectionStore {
  /** @returns the stored skin id, or undefined when none is stored or storage is unavailable. */
  read(): string | undefined
  /** @param id - skin id to store; a storage failure leaves only the in-memory selection. */
  write(id: string): void
}

const SKIN_ID = /^[a-z0-9][a-z0-9-]*$/

/** Figure box size in CSS pixels; skins draw into `viewBox="0 0 100 80"`. */
export const STAGE = { width: 100, height: 80 } as const

function bySelectionOrder(a: WorkpetSkin, b: WorkpetSkin): number {
  const order = (a.order ?? 0) - (b.order ?? 0)
  return order !== 0 ? order : a.id < b.id ? -1 : a.id > b.id ? 1 : 0
}

/** The `ctx.workpet` Service Definition implementation. */
export class WorkpetRegistry implements WorkpetService {
  readonly stage = STAGE
  private readonly registered = new Map<string, WorkpetSkin>()
  private readonly listeners = new Set<() => void>()
  private readonly store: SelectionStore
  private selectedId: string | undefined
  private snapshot: WorkpetSnapshot

  /** @param store - persistence for the user's selection. */
  constructor(store: SelectionStore) {
    this.store = store
    this.selectedId = store.read()
    this.snapshot = this.compose()
  }

  register(skin: WorkpetSkin): () => void {
    if (!SKIN_ID.test(skin.id)) throw new Error(`workpet: invalid skin id ${JSON.stringify(skin.id)}`)
    if (this.registered.has(skin.id)) throw new Error(`workpet: skin "${skin.id}" is already registered`)
    this.registered.set(skin.id, skin)
    this.publish()
    let active = true
    return () => {
      if (!active) return
      active = false
      if (this.registered.get(skin.id) !== skin) return
      this.registered.delete(skin.id)
      this.publish()
    }
  }

  select(id: string): void {
    if (this.selectedId === id) return
    this.selectedId = id
    this.store.write(id)
    this.publish()
  }

  /**
   * Adopt a selection written elsewhere (another tab) without writing it back.
   * @param id - the stored id, or undefined when it was cleared.
   */
  adopt(id: string | undefined): void {
    if (this.selectedId === id) return
    this.selectedId = id
    this.publish()
  }

  getSnapshot = (): WorkpetSnapshot => this.snapshot

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private compose(): WorkpetSnapshot {
    const skins = [...this.registered.values()].sort(bySelectionOrder)
    const selected = this.selectedId === undefined ? undefined : this.registered.get(this.selectedId)
    return { skins, selectedId: this.selectedId, current: selected ?? skins[0] }
  }

  private publish(): void {
    this.snapshot = this.compose()
    for (const listener of [...this.listeners]) listener()
  }
}

/**
 * Selection store backed by `localStorage`.
 * @param key - storage key.
 * @returns a store that tolerates unavailable storage.
 */
export function localSelectionStore(key: string): SelectionStore {
  return {
    read() {
      try {
        return globalThis.localStorage?.getItem(key) ?? undefined
      } catch (error) {
        // Storage disabled by the browser: fall back to the default skin.
        void error
        return undefined
      }
    },
    write(id) {
      try {
        globalThis.localStorage?.setItem(key, id)
      } catch (error) {
        // Quota or privacy mode: the selection still applies for this page.
        void error
      }
    },
  }
}
