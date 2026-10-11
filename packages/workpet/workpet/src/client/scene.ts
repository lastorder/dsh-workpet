/**
 * Pure derivation from Client runtime state to a {@link WorkpetScene}. Nothing
 * here touches React, the DOM, or timers, so the precedence rules are tested
 * directly.
 */
import type { WorkpetAwaitKind, WorkpetScene, WorkpetToolCategory, WorkpetToolInfo } from './contract.ts'

/** Live model activity read from one Session's Chat target. */
export type ChatActivity =
  | { readonly kind: 'tool'; readonly tool: WorkpetToolInfo }
  | { readonly kind: 'retrying' }
  | { readonly kind: 'writing' }
  | { readonly kind: 'thinking' }

/** What the composer-dock probe publishes for one Session. */
export interface ChatSignal {
  /** Live activity, or undefined when nothing is in flight. */
  readonly live: ChatActivity | undefined
  /** Whether the newest settled conversation node is a turn error. */
  readonly lastTurnFailed: boolean
}

export const EMPTY_SIGNAL: ChatSignal = { live: undefined, lastTurnFailed: false }

const TOOL_CATEGORIES: ReadonlyArray<readonly [RegExp, WorkpetToolCategory]> = [
  [/^(bash|pwsh|terminal_|job_)/i, 'shell'],
  [/^(grep|glob|read|lsp|cordis_inspect|session_)/i, 'search'],
  [/^(edit|write|str_replace|apply_patch)/i, 'edit'],
  [/^(web_|fetch|browser)/i, 'web'],
  [/^(subagent|spawn_teammate|team_task|send_message|list_agents|wait_agent|interrupt_agent|workflow|ralph)/i, 'delegate'],
  [/^(todo_write|create_goal|update_goal|get_goal|schedule_|exit_plan_mode)/i, 'plan'],
  [/^ask_user_question/i, 'ask'],
]

/**
 * @param name - wire tool name.
 * @returns the coarse tool family.
 */
export function categorizeTool(name: string): WorkpetToolCategory {
  for (const [pattern, category] of TOOL_CATEGORIES) if (pattern.test(name)) return category
  return 'other'
}

/**
 * @param kind - `SessionStatus.pendingInteraction.kind`.
 * @returns the awaited interaction family.
 */
export function awaitKindOf(kind: string): WorkpetAwaitKind {
  return kind === 'approval' || kind === 'question' || kind === 'plan-review' ? kind : 'other'
}

interface BlockLike { readonly kind?: string; readonly text?: unknown }
interface ToolLike { readonly name?: unknown; readonly phase?: unknown }
interface NodeLike { readonly kind?: unknown; readonly retryState?: unknown }

/** The `legacy` slice of the Chat snapshot this module reads. */
export interface ChatLegacySlice {
  readonly nodes?: readonly NodeLike[]
  readonly partial?: { readonly blocks?: readonly BlockLike[] } | null
  readonly runningCalls?: readonly ToolLike[]
}

function hasVisibleText(blocks: readonly BlockLike[] | undefined): boolean {
  return (blocks ?? []).some(block => (block.kind === 'text' || block.kind === 'reasoning')
    && typeof block.text === 'string' && block.text.trim() !== '')
}

/**
 * Read the live activity from the Chat target's compatibility slice: running
 * tool calls win, then a scheduled retry, then the in-progress assistant step.
 * @param legacy - `ChatSnapshot.legacy`.
 * @returns the probe signal.
 */
export function chatSignalOf(legacy: ChatLegacySlice | undefined): ChatSignal {
  if (legacy === undefined) return EMPTY_SIGNAL
  const nodes = legacy.nodes ?? []
  const last = nodes[nodes.length - 1]
  const lastTurnFailed = last?.kind === 'turn-error'
  const calls = legacy.runningCalls ?? []
  const call = calls[calls.length - 1]
  if (call !== undefined && typeof call.name === 'string') {
    return { live: { kind: 'tool', tool: { name: call.name, category: categorizeTool(call.name) } }, lastTurnFailed }
  }
  if (last?.kind === 'model-retry' && last.retryState === 'scheduled') return { live: { kind: 'retrying' }, lastTurnFailed }
  const partial = legacy.partial
  if (partial !== null && partial !== undefined) {
    return { live: { kind: hasVisibleText(partial.blocks) ? 'writing' : 'thinking' }, lastTurnFailed }
  }
  return { live: undefined, lastTurnFailed }
}

/**
 * Two signals are equal when they would produce the same scene.
 * @param a - previous signal.
 * @param b - next signal.
 * @returns whether publishing `b` after `a` changes nothing.
 */
export function sameSignal(a: ChatSignal | undefined, b: ChatSignal | undefined): boolean {
  if (a === b) return true
  if (a === undefined || b === undefined) return false
  if (a.lastTurnFailed !== b.lastTurnFailed) return false
  const x = a.live
  const y = b.live
  if (x === y) return true
  if (x === undefined || y === undefined || x.kind !== y.kind) return false
  return x.kind !== 'tool' || (y.kind === 'tool' && x.tool.name === y.tool.name)
}

/** Facts about the main-view Session and the user's interaction with the pet. */
export interface SceneInput {
  /** Whether a Session is open in the main view. */
  readonly hasSession: boolean
  readonly running: boolean
  /** `pendingInteraction.kind`, when the Session waits for the user. */
  readonly pending: string | undefined
  readonly signal: ChatSignal | undefined
  readonly helpers: number
  readonly dragging: boolean
  readonly petted: boolean
  /** Turn-end celebration currently on display. */
  readonly celebration: 'done' | 'error' | undefined
  readonly asleep: boolean
}

/**
 * Apply the activity precedence: absent, dragged, petted (only when nothing
 * needs attention), awaiting, the live running activities (retrying, tool,
 * writing, thinking), delegating, done, error, sleeping, idle.
 * @param input - current facts.
 * @returns the scene to draw.
 */
export function deriveScene(input: SceneInput): WorkpetScene {
  const helpers = input.helpers
  if (!input.hasSession) return { activity: 'absent', helpers: 0 }
  if (input.dragging) return { activity: 'dragged', helpers }
  if (input.petted && input.pending === undefined && !input.running) return { activity: 'petted', helpers }
  if (input.pending !== undefined) return { activity: 'awaiting', awaiting: awaitKindOf(input.pending), helpers }
  if (input.running) {
    const live = input.signal?.live
    if (live?.kind === 'tool') return { activity: 'tool', tool: live.tool, helpers }
    if (live?.kind === 'retrying') return { activity: 'retrying', helpers }
    if (live?.kind === 'writing') return { activity: 'writing', helpers }
    return { activity: 'thinking', helpers }
  }
  if (helpers > 0) return { activity: 'delegating', helpers }
  if (input.celebration === 'done') return { activity: 'done', helpers }
  if (input.celebration === 'error') return { activity: 'error', helpers }
  if (input.asleep) return { activity: 'sleeping', helpers }
  return { activity: 'idle', helpers }
}

/** The fields of the Client session list this module reads. */
export interface SessionListLike {
  readonly byId?: Readonly<Record<string, {
    readonly running?: boolean
    readonly displayTitle?: string
    readonly title?: string
    readonly retainedBy?: Readonly<Record<string, number | undefined>>
  } | undefined>>
  readonly projectionsBySession?: Readonly<Record<string, {
    readonly values?: { readonly subagentCatalog?: unknown }
  } | undefined>>
}

/** The fields of one `SessionStatus` this module reads. */
export interface SessionStatusLike {
  readonly running?: boolean | undefined
  readonly pendingInteraction?: { readonly kind?: string } | undefined
}

/**
 * @param sessions - Client session list.
 * @returns the id of the Session the main view retains, if any.
 */
export function mainSessionId(sessions: SessionListLike | undefined): string | undefined {
  const byId = sessions?.byId ?? {}
  for (const id of Object.keys(byId)) {
    if ((byId[id]?.retainedBy?.mainView ?? 0) > 0) return id
  }
  return undefined
}

/**
 * Count running child agents from the parent's `subagentCatalog` projection.
 * @param sessions - Client session list.
 * @param status - status lookup by Session id.
 * @param parentId - main-view Session.
 * @returns running children.
 */
export function runningHelpers(
  sessions: SessionListLike | undefined,
  status: (id: string) => SessionStatusLike | undefined,
  parentId: string,
): number {
  const catalog = sessions?.projectionsBySession?.[parentId]?.values?.subagentCatalog
  if (!Array.isArray(catalog)) return 0
  let count = 0
  for (const child of catalog) {
    const id = (child as { id?: unknown } | null)?.id
    if (typeof id !== 'string') continue
    if ((status(id)?.running ?? sessions?.byId?.[id]?.running) === true) count += 1
  }
  return count
}
