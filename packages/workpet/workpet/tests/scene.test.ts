import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  categorizeTool, chatSignalOf, deriveScene, EMPTY_SIGNAL, mainSessionId, runningHelpers, sameSignal, type SceneInput,
} from '../src/client/scene.ts'
import { ChatSignalTable } from '../src/client/signals.ts'

const base: SceneInput = {
  hasSession: true, running: false, pending: undefined, signal: undefined, helpers: 0,
  dragging: false, petted: false, celebration: undefined, asleep: false,
}

describe('deriveScene', () => {
  it('is absent without a main-view Session, whatever else is true', () => {
    assert.deepEqual(deriveScene({ ...base, hasSession: false, dragging: true, running: true, helpers: 3 }), { activity: 'absent', helpers: 0 })
  })

  it('lets dragging win over everything else', () => {
    assert.equal(deriveScene({ ...base, dragging: true, pending: 'approval', running: true }).activity, 'dragged')
  })

  it('shows petting only when nothing needs attention', () => {
    assert.equal(deriveScene({ ...base, petted: true }).activity, 'petted')
    assert.equal(deriveScene({ ...base, petted: true, running: true }).activity, 'thinking')
    assert.equal(deriveScene({ ...base, petted: true, pending: 'question' }).activity, 'awaiting')
  })

  it('maps pending interactions to awaiting kinds', () => {
    assert.deepEqual(deriveScene({ ...base, running: true, pending: 'approval' }), { activity: 'awaiting', awaiting: 'approval', helpers: 0 })
    assert.equal(deriveScene({ ...base, pending: 'plan-review' }).awaiting, 'plan-review')
    assert.equal(deriveScene({ ...base, pending: 'custom-domain' }).awaiting, 'other')
  })

  it('reads live Chat activity while running and falls back to thinking', () => {
    const tool = { name: 'bash', category: 'shell' as const }
    assert.deepEqual(deriveScene({ ...base, running: true, signal: { live: { kind: 'tool', tool }, lastTurnFailed: false } }),
      { activity: 'tool', tool, helpers: 0 })
    assert.equal(deriveScene({ ...base, running: true, signal: { live: { kind: 'retrying' }, lastTurnFailed: false } }).activity, 'retrying')
    assert.equal(deriveScene({ ...base, running: true, signal: { live: { kind: 'writing' }, lastTurnFailed: false } }).activity, 'writing')
    assert.equal(deriveScene({ ...base, running: true }).activity, 'thinking')
  })

  it('ignores a stale live signal once the Session stops', () => {
    assert.equal(deriveScene({ ...base, signal: { live: { kind: 'writing' }, lastTurnFailed: false } }).activity, 'idle')
  })

  it('orders the idle states: delegating, done, error, sleeping, idle', () => {
    assert.deepEqual(deriveScene({ ...base, helpers: 2, celebration: 'done' }), { activity: 'delegating', helpers: 2 })
    assert.equal(deriveScene({ ...base, celebration: 'done', asleep: true }).activity, 'done')
    assert.equal(deriveScene({ ...base, celebration: 'error', asleep: true }).activity, 'error')
    assert.equal(deriveScene({ ...base, asleep: true }).activity, 'sleeping')
    assert.equal(deriveScene(base).activity, 'idle')
  })
})

describe('chatSignalOf', () => {
  it('prefers the newest running tool call', () => {
    const signal = chatSignalOf({ runningCalls: [{ name: 'read', phase: 'start' }, { name: 'web_search', phase: 'preparing' }], partial: { blocks: [] } })
    assert.deepEqual(signal.live, { kind: 'tool', tool: { name: 'web_search', category: 'web' } })
  })

  it('detects a scheduled retry only as the newest settled node', () => {
    assert.deepEqual(chatSignalOf({ nodes: [{ kind: 'model-retry', retryState: 'scheduled' }] }).live, { kind: 'retrying' })
    assert.equal(chatSignalOf({ nodes: [{ kind: 'model-retry', retryState: 'started' }] }).live, undefined)
  })

  it('tells writing from thinking by visible text', () => {
    assert.deepEqual(chatSignalOf({ partial: { blocks: [{ kind: 'reasoning', text: '  ' }] } }).live, { kind: 'thinking' })
    assert.deepEqual(chatSignalOf({ partial: { blocks: [{ kind: 'text', text: 'Hi' }] } }).live, { kind: 'writing' })
  })

  it('reports a failed last turn', () => {
    assert.deepEqual(chatSignalOf({ nodes: [{ kind: 'user' }, { kind: 'turn-error' }], partial: null }), { live: undefined, lastTurnFailed: true })
    assert.equal(chatSignalOf(undefined), EMPTY_SIGNAL)
  })

  it('compares signals by what the scene uses', () => {
    const a = chatSignalOf({ runningCalls: [{ name: 'bash' }] })
    const b = chatSignalOf({ runningCalls: [{ name: 'bash' }] })
    assert.ok(sameSignal(a, b))
    assert.ok(!sameSignal(a, chatSignalOf({ runningCalls: [{ name: 'grep' }] })))
    assert.ok(!sameSignal(a, { ...a, lastTurnFailed: true }))
  })
})

describe('session helpers', () => {
  it('categorizes tool names', () => {
    assert.equal(categorizeTool('bash'), 'shell')
    assert.equal(categorizeTool('grep'), 'search')
    assert.equal(categorizeTool('edit'), 'edit')
    assert.equal(categorizeTool('subagent'), 'delegate')
    assert.equal(categorizeTool('todo_write'), 'plan')
    assert.equal(categorizeTool('ask_user_question'), 'ask')
    assert.equal(categorizeTool('mcp__x__y'), 'other')
  })

  it('finds the main-view Session and counts running helpers', () => {
    const sessions = {
      byId: {
        a: { running: false, retainedBy: {} },
        b: { running: true, retainedBy: { mainView: 1 } },
        c1: { running: true, retainedBy: {} },
        c2: { running: false, retainedBy: {} },
      },
      projectionsBySession: { b: { values: { subagentCatalog: [{ id: 'c1' }, { id: 'c2' }, { id: 'c3' }, null] } } },
    }
    assert.equal(mainSessionId(sessions), 'b')
    assert.equal(mainSessionId({ byId: {} }), undefined)
    const status = new Map([['c2', { running: true }], ['c3', { running: true }]])
    assert.equal(runningHelpers(sessions, id => status.get(id), 'b'), 3)
    assert.equal(runningHelpers(sessions, () => undefined, 'a'), 0)
  })
})

describe('ChatSignalTable', () => {
  it('keeps an entry while retained and notifies on real changes only', () => {
    const table = new ChatSignalTable()
    let calls = 0
    table.subscribe(() => { calls += 1 })
    table.publish('s', { live: { kind: 'writing' }, lastTurnFailed: false })
    assert.equal(table.read('s'), undefined)
    const release1 = table.retain('s')
    const release2 = table.retain('s')
    table.publish('s', { live: { kind: 'writing' }, lastTurnFailed: false })
    table.publish('s', { live: { kind: 'writing' }, lastTurnFailed: false })
    assert.equal(calls, 1)
    release1()
    release1()
    assert.equal(table.read('s')?.live?.kind, 'writing')
    release2()
    assert.equal(table.read('s'), undefined)
    assert.equal(calls, 2)
  })
})
