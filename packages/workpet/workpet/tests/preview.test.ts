import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { WorkpetActivity } from '../src/client/contract.ts'
import { en, zh } from '../src/client/locale.ts'
import { choiceOf, DEFAULT_CHOICE, PREVIEW_CHOICES, PREVIEW_GROUPS, PREVIEW_HELPERS, previewScene, TOOL_ORDER } from '../src/client/preview.ts'
import { TOOL_GLYPH } from '../src/client/scene.ts'

const ACTIVITIES: readonly WorkpetActivity[] = [
  'absent', 'idle', 'sleeping', 'thinking', 'writing', 'tool', 'retrying', 'awaiting', 'delegating', 'done', 'error', 'petted', 'dragged',
]

describe('preview catalogue', () => {
  it('offers every activity, each choice once', () => {
    const keys = PREVIEW_CHOICES.map(choice => choice.key)
    assert.equal(new Set(keys).size, keys.length)
    assert.deepEqual(new Set(PREVIEW_CHOICES.map(choice => choice.activity)), new Set(ACTIVITIES))
    assert.deepEqual(
      PREVIEW_CHOICES.filter(choice => choice.activity === 'awaiting').map(choice => choice.awaiting),
      ['approval', 'question', 'plan-review'],
    )
    assert.ok(PREVIEW_CHOICES.every(choice => (choice.activity === 'awaiting') === (choice.awaiting !== undefined)))
    assert.equal(PREVIEW_CHOICES[0], DEFAULT_CHOICE)
    assert.equal(choiceOf('nope'), DEFAULT_CHOICE)
    assert.equal(choiceOf('question').awaiting, 'question')
  })

  it('builds the scene each button previews', () => {
    assert.deepEqual(previewScene(choiceOf('tool'), 'web'), { activity: 'tool', tool: { name: 'web_fetch', category: 'web' }, helpers: 0 })
    assert.deepEqual(previewScene(choiceOf('plan-review'), 'shell'), { activity: 'awaiting', awaiting: 'plan-review', helpers: 0 })
    assert.deepEqual(previewScene(choiceOf('delegating'), 'shell'), { activity: 'delegating', helpers: PREVIEW_HELPERS })
    assert.deepEqual(previewScene(choiceOf('sleeping'), 'shell'), { activity: 'sleeping', helpers: 0 })
    for (const category of TOOL_ORDER) assert.equal(previewScene(choiceOf('tool'), category).tool?.category, category)
  })

  it('has a glyph for every tool family', () => {
    assert.deepEqual(new Set(TOOL_ORDER), new Set(Object.keys(TOOL_GLYPH)))
  })

  it('labels every group, choice, and tool family in both languages', () => {
    const keys = [
      ...PREVIEW_GROUPS.map(group => `group.${group.id}`),
      ...PREVIEW_CHOICES.map(choice => `preview.${choice.key}`),
      ...TOOL_ORDER.map(category => `tool.${category}`),
      'config.title', 'config.description', 'config.count', 'config.gallery', 'config.more', 'config.empty',
      'config.actions', 'config.actionsHint', 'config.toolKind', 'config.source', 'config.sourceTitle',
    ]
    for (const key of keys) {
      assert.ok(zh[key], `zh is missing ${key}`)
      assert.ok(en[key], `en is missing ${key}`)
    }
    assert.deepEqual(Object.keys(zh).sort(), Object.keys(en).sort())
  })
})
