/**
 * The workpet capability contract: the vocabulary every skin provider and the
 * `ctx.workpet` registry share. This module holds types only, so a provider
 * imports it with `import type` and ships no runtime code from this package.
 *
 * Roles (one capability, three roles):
 * - Service Definition — `ctx.workpet` ({@link WorkpetService}), provided by
 *   the `dsh-workpet` Client half.
 * - Service Provider — a skin package that calls
 *   {@link WorkpetService.register} with a {@link WorkpetSkin}.
 * - Consumer — the floating pet in `shell.overlay` (also in `dsh-workpet`),
 *   which derives one {@link WorkpetScene} per render and hands it to the
 *   selected skin's {@link WorkpetSkin.Figure}.
 *
 * @module dsh-workpet/contract
 */
import type { ComponentType } from 'react'

/**
 * Everything the pet can be doing. The Consumer derives exactly one activity
 * per render from the main-view Session; the precedence is documented in
 * `docs/architecture.md`.
 *
 * - `absent` — no Session is open in the main view.
 * - `idle` — the Session is idle.
 * - `sleeping` — the Session has been idle long enough to doze off.
 * - `thinking` — the model is running and has produced no visible output yet.
 * - `writing` — the model is streaming text or reasoning.
 * - `tool` — a tool call is preparing or running; see {@link WorkpetScene.tool}.
 * - `retrying` — a failed model request is waiting for its retry.
 * - `awaiting` — the Session waits for the user; see {@link WorkpetScene.awaiting}.
 * - `delegating` — the Session is idle while its child agents still run.
 * - `done` — the Session just finished a turn (shown for a few seconds).
 * - `error` — the Session just ended a turn with an error (shown for a few seconds).
 * - `petted` — the user clicked the pet while nothing needed attention.
 * - `dragged` — the user is dragging the pet.
 */
export type WorkpetActivity =
  | 'absent'
  | 'idle'
  | 'sleeping'
  | 'thinking'
  | 'writing'
  | 'tool'
  | 'retrying'
  | 'awaiting'
  | 'delegating'
  | 'done'
  | 'error'
  | 'petted'
  | 'dragged'

/** Coarse tool family, derived from the tool name. */
export type WorkpetToolCategory = 'shell' | 'search' | 'edit' | 'web' | 'delegate' | 'plan' | 'ask' | 'other'

/** What the Session waits for while {@link WorkpetActivity} is `awaiting`. */
export type WorkpetAwaitKind = 'approval' | 'question' | 'plan-review' | 'other'

/** The running tool while {@link WorkpetActivity} is `tool`. */
export interface WorkpetToolInfo {
  /** Wire tool name, e.g. `bash`. */
  readonly name: string
  readonly category: WorkpetToolCategory
}

/** One derived moment of the pet's life, handed to a skin's Figure. */
export interface WorkpetScene {
  readonly activity: WorkpetActivity
  /** Present exactly when `activity` is `tool`. */
  readonly tool?: WorkpetToolInfo
  /** Present exactly when `activity` is `awaiting`. */
  readonly awaiting?: WorkpetAwaitKind
  /** Child agents of the main-view Session that are currently running. */
  readonly helpers: number
}

/**
 * Props of a skin's Figure. The Figure fills a box of
 * {@link WorkpetService.stage} CSS pixels (draw into `viewBox="0 0 100 80"`
 * with `width="100%" height="100%"`). It draws only the creature: the
 * Consumer owns position, dragging, the status bubble, the tool badge, helper
 * companions, and the effect layer (hearts, sparkles, `z`, `!`, `?`).
 */
export interface WorkpetFigureProps {
  readonly scene: WorkpetScene
  /**
   * `true` when the Figure renders as a scaled-down companion or a static
   * preview; a skin may simplify its drawing.
   */
  readonly compact?: boolean
}

/** A pet appearance contributed by a Service Provider. */
export interface WorkpetSkin {
  /**
   * Stable, globally unique id (`[a-z0-9-]+`). The user's selection is
   * stored by this id, so renaming it resets that selection.
   */
  readonly id: string
  /**
   * Position in the selection list, ascending; ties sort by id. When the
   * stored selection is not registered, the first skin in this order is used.
   */
  readonly order?: number
  /** Localized display name, read at render time. */
  title(): string
  /** Optional localized one-line description, read at render time. */
  description?(): string
  /** React component that draws the creature for one scene. */
  readonly Figure: ComponentType<WorkpetFigureProps>
}

/** Immutable registry state; the object identity changes on every change. */
export interface WorkpetSnapshot {
  /** Registered skins in selection order. */
  readonly skins: readonly WorkpetSkin[]
  /** The stored selection, which may name a skin that is not registered. */
  readonly selectedId: string | undefined
  /** The skin to draw: the selected one when registered, else `skins[0]`. */
  readonly current: WorkpetSkin | undefined
}

/** The `ctx.workpet` Service Definition. */
export interface WorkpetService {
  /** Figure box size in CSS pixels. */
  readonly stage: { readonly width: number; readonly height: number }
  /**
   * Register a skin for as long as the caller's effect lives.
   * @param skin - the skin; its id must be unique among registered skins.
   * @returns disposer that unregisters exactly this registration.
   * @throws when the id is malformed or already registered.
   */
  register(skin: WorkpetSkin): () => void
  /**
   * Store the user's selection. Selecting an unregistered id is allowed: it
   * takes effect once a skin with that id registers.
   * @param id - skin id.
   */
  select(id: string): void
  /** @returns the current immutable snapshot. */
  getSnapshot(): WorkpetSnapshot
  /**
   * @param listener - called after every registration, removal, or selection change.
   * @returns unsubscriber.
   */
  subscribe(listener: () => void): () => void
}

/** Locale dictionaries keyed by the Client's built-in locale ids. */
export type WorkpetLocaleDicts = Record<'en' | 'zh', Record<string, string>>

/**
 * The part of the Client plugin context a skin provider uses. A provider
 * declares `inject = ['workpet', 'locale']` so it activates only while the
 * capability is available, and adds `"dsh-workpet"` to `dsh.client.inject`
 * in its manifest so the capability's factory arrives first.
 */
export interface WorkpetProviderContext {
  readonly workpet: WorkpetService
  readonly locale: {
    register(ns: string, dicts: WorkpetLocaleDicts): () => void
    bind(ns: string): (key: string, params?: Record<string, string | number>) => string
  }
  /**
   * Run a resource-acquiring callback and dispose its result when the plugin unloads.
   * @param callback - returns the cleanup.
   * @param label - diagnostic label.
   */
  effect(callback: () => () => void, label?: string): () => void
}
