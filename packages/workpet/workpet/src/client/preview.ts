/**
 * The action catalogue of the configuration page: every activity a pet can
 * act out, grouped the way a user thinks about a Session, with the scene
 * each button previews. Pure, so the catalogue is tested directly.
 */
import type { WorkpetActivity, WorkpetAwaitKind, WorkpetScene, WorkpetToolCategory } from './contract.ts'

/** One preview button. */
export interface PreviewChoice {
  /** Unique key; also the suffix of its `preview.*` label. */
  readonly key: string
  readonly activity: WorkpetActivity
  /** Set exactly for `awaiting` choices. */
  readonly awaiting?: WorkpetAwaitKind
  /** Button glyph; `tool` uses the glyph of the chosen tool family instead. */
  readonly glyph: string
}

/** A labelled row of buttons; the label is `group.<id>`. */
export interface PreviewGroup {
  readonly id: 'daily' | 'working' | 'waiting' | 'finish' | 'interact'
  readonly choices: readonly PreviewChoice[]
}

/** The choice shown when the page opens. */
export const DEFAULT_CHOICE: PreviewChoice = { key: 'idle', activity: 'idle', glyph: '☁️' }

export const PREVIEW_GROUPS: readonly PreviewGroup[] = [
  {
    id: 'daily',
    choices: [
      DEFAULT_CHOICE,
      { key: 'sleeping', activity: 'sleeping', glyph: '💤' },
      { key: 'absent', activity: 'absent', glyph: '🌙' },
    ],
  },
  {
    id: 'working',
    choices: [
      { key: 'thinking', activity: 'thinking', glyph: '💭' },
      { key: 'writing', activity: 'writing', glyph: '✍️' },
      { key: 'tool', activity: 'tool', glyph: '🔧' },
      { key: 'retrying', activity: 'retrying', glyph: '🔁' },
      { key: 'delegating', activity: 'delegating', glyph: '🤝' },
    ],
  },
  {
    id: 'waiting',
    choices: [
      { key: 'approval', activity: 'awaiting', awaiting: 'approval', glyph: '✋' },
      { key: 'question', activity: 'awaiting', awaiting: 'question', glyph: '❓' },
      { key: 'plan-review', activity: 'awaiting', awaiting: 'plan-review', glyph: '📋' },
    ],
  },
  {
    id: 'finish',
    choices: [
      { key: 'done', activity: 'done', glyph: '🎉' },
      { key: 'error', activity: 'error', glyph: '💧' },
    ],
  },
  {
    id: 'interact',
    choices: [
      { key: 'petted', activity: 'petted', glyph: '💗' },
      { key: 'dragged', activity: 'dragged', glyph: '🤲' },
    ],
  },
]

/** Every choice, in display order. */
export const PREVIEW_CHOICES: readonly PreviewChoice[] = PREVIEW_GROUPS.flatMap(group => group.choices)

/** Tool families in the order the tool row shows them. */
export const TOOL_ORDER: readonly WorkpetToolCategory[] = ['shell', 'search', 'edit', 'web', 'delegate', 'plan', 'ask', 'other']

/** A representative wire tool name per family, so a preview scene looks like a real one. */
const SAMPLE_TOOL: Readonly<Record<WorkpetToolCategory, string>> = {
  shell: 'bash',
  search: 'grep',
  edit: 'edit',
  web: 'web_fetch',
  delegate: 'subagent',
  plan: 'todo_write',
  ask: 'ask_user_question',
  other: 'tool',
}

/** Running helpers in the `delegating` preview: enough to show both companions. */
export const PREVIEW_HELPERS = 2

/**
 * @param key - a {@link PreviewChoice.key}.
 * @returns that choice, or the default one for an unknown key.
 */
export function choiceOf(key: string): PreviewChoice {
  return PREVIEW_CHOICES.find(choice => choice.key === key) ?? DEFAULT_CHOICE
}

/**
 * @param choice - the pressed button.
 * @param tool - the tool family chosen for the `tool` button.
 * @returns the scene every pet on the page acts out.
 */
export function previewScene(choice: PreviewChoice, tool: WorkpetToolCategory): WorkpetScene {
  switch (choice.activity) {
    case 'tool': return { activity: 'tool', tool: { name: SAMPLE_TOOL[tool], category: tool }, helpers: 0 }
    case 'awaiting': return { activity: 'awaiting', awaiting: choice.awaiting ?? 'other', helpers: 0 }
    case 'delegating': return { activity: 'delegating', helpers: PREVIEW_HELPERS }
    default: return { activity: choice.activity, helpers: 0 }
  }
}
