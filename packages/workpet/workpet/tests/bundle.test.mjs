// Integration smoke test over the BUILT Client halves (run `pnpm run build`
// first): the capability and the default cat skin load through the module
// loader format, wire together through `ctx.workpet`, and render.
import assert from 'node:assert/strict'
import { dirname, join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createRuntime, loadClientBundle, React, render } from '../../../../scripts/testing/client-harness.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const workpetBundle = join(here, '../lib/client.js')
const catBundle = join(here, '../../workpet-cat/lib/client.js')

const ACTIVITIES = ['absent', 'idle', 'sleeping', 'thinking', 'writing', 'tool', 'retrying', 'awaiting', 'delegating', 'done', 'error', 'petted', 'dragged']

function boot(language = 'en') {
  const runtime = createRuntime(language)
  const workpet = loadClientBundle(workpetBundle)
  const cat = loadClientBundle(catBundle)
  workpet.exports.apply(runtime.ctx)
  cat.exports.apply(runtime.ctx)
  return { runtime, workpet, cat }
}

const hook = value => selector => selector(value)
const statusMap = entries => new Map(Object.entries(entries))

function overlayProps(runtime, sessions, statuses = {}) {
  return {
    t: runtime.t('workpet'),
    useSessions: hook(sessions),
    useSessionStatus: hook(statusMap(statuses)),
    usePanelInfo: hook({ activePanelId: null }),
  }
}

describe('built bundles', () => {
  it('declare the module ids and Cordis injections', () => {
    const { workpet, cat } = boot()
    assert.equal(workpet.id, 'dsh-workpet')
    assert.deepEqual(workpet.exports.inject, ['slots', 'locale'])
    assert.equal(cat.id, 'dsh-workpet-cat')
    assert.deepEqual(cat.exports.inject, ['workpet', 'locale'])
  })

  it('provide ctx.workpet, register the cat, and contribute three slots', () => {
    const { runtime } = boot()
    const registry = runtime.services.get('workpet')
    assert.deepEqual(registry.getSnapshot().skins.map(skin => skin.id), ['cat'])
    assert.equal(registry.getSnapshot().current.title(), 'Ginger Kitten (default)')
    assert.equal(runtime.slot('shell.overlay').length, 1)
    assert.equal(runtime.slot('conversation.composer.dock').length, 1)
    const [config] = runtime.slot('plugins.bundle.config')
    assert.equal(config.options.key, 'dsh-workpet')
  })

  it('unregisters the cat when its plugin unloads', () => {
    const { runtime } = boot()
    const registry = runtime.services.get('workpet')
    runtime.dispose()
    assert.equal(registry.getSnapshot().skins.length, 0)
  })

  it('renders the overlay for session states', () => {
    const { runtime } = boot()
    const Overlay = runtime.slot('shell.overlay')[0].component
    const none = render(Overlay, overlayProps(runtime, { byId: {} }))
    assert.match(none, /data-activity="absent"/)
    assert.match(none, /data-skin="cat"/)
    const main = { byId: { s1: { id: 's1', displayTitle: 'Fix it', running: true, retainedBy: { mainView: 1 } } } }
    assert.match(render(Overlay, overlayProps(runtime, main, { s1: { running: true } })), /data-activity="thinking"/)
    assert.match(render(Overlay, overlayProps(runtime, main, { s1: { running: true, pendingInteraction: { kind: 'approval' } } })), /data-activity="awaiting"[^>]*data-alert="true"/)
    const idle = { byId: { s1: { ...main.byId.s1, running: false } } }
    assert.match(render(Overlay, overlayProps(runtime, idle, { s1: { running: false } })), /data-activity="idle"/)
    const team = { ...idle, projectionsBySession: { s1: { values: { subagentCatalog: [{ id: 'c1' }] } } } }
    const html = render(Overlay, overlayProps(runtime, team, { s1: { running: false }, c1: { running: true } }))
    assert.match(html, /data-activity="delegating"/)
    assert.match(html, /wp-companion/)
  })

  it('renders nothing from the probe', () => {
    const { runtime } = boot()
    const Probe = runtime.slot('conversation.composer.dock')[0].component
    const legacy = { nodes: [], partial: null, runningCalls: [{ name: 'bash', phase: 'start' }] }
    assert.equal(render(Probe, { sessionId: 's1', useChat: hook({ legacy }) }), '')
  })

  it('lists every registered skin in the configuration dropdown', () => {
    const { runtime } = boot('zh')
    const registry = runtime.services.get('workpet')
    const Figure = () => React.createElement('svg', { 'data-test': 'parrot' })
    registry.register({ id: 'parrot', order: 10, title: () => 'Parrot', Figure })
    const Page = runtime.slot('plugins.bundle.config')[0].component
    const html = render(Page, { t: runtime.t('workpet'), view: 'page' })
    assert.match(html, /<option value="cat"[^>]*>橘白小猫（默认）<\/option>/)
    assert.match(html, /<option value="parrot"[^>]*>Parrot<\/option>/)
    assert.match(html, /宠物形象/)
    registry.select('parrot')
    assert.match(render(Page, { t: runtime.t('workpet'), view: 'page' }), /data-test="parrot"/)
    assert.equal(render(Page, { t: runtime.t('workpet'), view: 'summary' }), '')
  })

  it('draws the cat for every activity', () => {
    const { runtime } = boot()
    const { Figure } = runtime.services.get('workpet').getSnapshot().current
    for (const activity of ACTIVITIES) {
      const scene = { activity, helpers: 0, ...(activity === 'tool' ? { tool: { name: 'bash', category: 'shell' } } : {}), ...(activity === 'awaiting' ? { awaiting: 'question' } : {}) }
      const html = render(Figure, { scene })
      assert.match(html, /^<svg class="wpc"/, activity)
      assert.doesNotMatch(html, /NaN|undefined/, activity)
    }
    assert.match(render(Figure, { scene: { activity: 'tool', helpers: 0 }, compact: true }), /<svg/)
  })
})
