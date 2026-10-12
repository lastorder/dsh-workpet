/**
 * `WorkpetRegistry`, the concrete registry behind `ctx.workpet`: the
 * registered skins, published as one immutable snapshot. Every registered
 * skin is a pet on screen, so the registry holds no selection.
 */
import type { WorkpetService, WorkpetSkin, WorkpetSnapshot } from './contract.ts'

const SKIN_ID = /^[a-z0-9][a-z0-9-]*$/

/** Figure box size in CSS pixels; skins draw into `viewBox="0 0 100 80"`. */
export const STAGE = { width: 100, height: 80 } as const

function byOrder(a: WorkpetSkin, b: WorkpetSkin): number {
  const order = (a.order ?? 0) - (b.order ?? 0)
  return order !== 0 ? order : a.id < b.id ? -1 : a.id > b.id ? 1 : 0
}

/** The `ctx.workpet` Service Definition implementation. */
export class WorkpetRegistry implements WorkpetService {
  readonly stage = STAGE
  private readonly registered = new Map<string, WorkpetSkin>()
  private readonly listeners = new Set<() => void>()
  private snapshot: WorkpetSnapshot = { skins: [] }

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

  getSnapshot = (): WorkpetSnapshot => this.snapshot

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private publish(): void {
    this.snapshot = { skins: [...this.registered.values()].sort(byOrder) }
    for (const listener of [...this.listeners]) listener()
  }
}
