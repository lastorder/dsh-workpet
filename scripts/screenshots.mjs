/**
 * Render the README screenshots from the built Client halves.
 *
 *   pnpm run build
 *   node scripts/screenshots.mjs --parrot ../dsh-workpet-parrot [--chrome <path>] [--out docs/images]
 *
 * The pets, the configuration page, and the pose sheets are rendered with
 * React's server renderer through the same module-loader harness the tests
 * use, wrapped in a page with the light DeepSeek Harness theme tokens, and
 * photographed by headless Chrome at 2× scale. The cockatiel comes from a
 * dsh-workpet-parrot checkout so the pictures show more than one pet; its pose
 * sheet is written here too and copied to that repository by hand.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import { createRuntime, loadClientBundle, React, render } from './testing/client-harness.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)

function option(name, fallback) {
  const index = process.argv.indexOf(`--${name}`)
  return index === -1 ? fallback : process.argv[index + 1]
}

const parrotDir = option('parrot')
if (parrotDir === undefined) {
  console.error('usage: node scripts/screenshots.mjs --parrot <dsh-workpet-parrot checkout> [--chrome <path>] [--out <dir>]')
  process.exit(1)
}
const chrome = option('chrome', process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
const out = resolve(root, option('out', 'docs/images'))

/** Light theme tokens of the DeepSeek Harness page. */
const TOKENS = {
  'bg-base': '#f7f7f8', 'bg-layer-1': '#ffffff', 'bg-layer-2': '#f3f4f6', 'bg-overlay': '#ffffff',
  'border-l1': '#ececee', 'border-l2': '#dcdce0', 'brand-primary': '#4d6bfe',
  'label-primary': '#1f1f23', 'label-secondary': '#6b6b75',
  'state-warn-primary': '#d9822b', 'state-error-primary': '#e5484d', 'state-success-primary': '#2f9e63', 'state-idle-primary': '#a0a0a8',
}

const ACTIVITIES = ['idle', 'sleeping', 'absent', 'thinking', 'writing', 'tool', 'retrying', 'delegating', 'awaiting', 'done', 'error', 'petted', 'dragged']

/** Every stylesheet the plugins insert, captured while they load. */
const css = []
globalThis.document = {
  querySelector: () => null,
  createElement: () => ({ dataset: {}, set textContent(text) { if (!css.includes(text)) css.push(text) }, remove() {} }),
  head: { appendChild() {} },
}

function boot(language) {
  const runtime = createRuntime(language)
  for (const file of [
    join(root, 'packages/workpet/workpet/lib/client.js'),
    join(root, 'packages/workpet/workpet-cat/lib/client.js'),
    join(resolve(parrotDir), 'client.js'),
  ]) loadClientBundle(file).exports.apply(runtime.ctx)
  return runtime
}

/** `PetStage` is not exported by the bundle, so build it from source for the pose sheets. */
async function loadPetStage() {
  const result = await build({
    entryPoints: [join(root, 'packages/workpet/workpet/src/client/stage.tsx')],
    bundle: true, write: false, format: 'cjs', platform: 'node', jsx: 'automatic',
    external: ['react', 'react/jsx-runtime'], logLevel: 'silent',
  })
  const module = { exports: {} }
  new Function('require', 'module', 'exports', result.outputFiles[0].text)(require, module, module.exports)
  return module.exports.PetStage
}

/**
 * Render the configuration page with a chosen action: the page keeps its
 * choice in its first two `useState` calls (action, tool family).
 */
function withPreviewChoice(choice, tool, draw) {
  const real = React.useState
  let calls = 0
  React.useState = initial => {
    calls += 1
    if (calls === 1) return [choice, () => {}]
    if (calls === 2) return [tool, () => {}]
    return real(initial)
  }
  try {
    return draw()
  } finally {
    React.useState = real
  }
}

function page(width, height, body, extraCss = '') {
  const tokens = Object.entries(TOKENS).map(([name, value]) => `--dsw-alias-${name}:${value};`).join('')
  return `<!doctype html><html><head><meta charset="utf-8"><style>
:root{${tokens}--dsw-specific-sidebar-fill:#efeff1;}
html,body{margin:0;width:${width}px;height:${height}px;overflow:hidden;background:var(--dsw-alias-bg-base);
  font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Segoe UI",sans-serif;color:var(--dsw-alias-label-primary);}
${css.join('\n')}
${extraCss}
</style></head><body>${body}</body></html>`
}

/** A sketch of the Harness window around the pets: sidebar, a conversation, and the composer. */
function appWindow(overlay) {
  const line = (width, tone = 'l2') => `<div style="height:9px;width:${width}%;border-radius:5px;background:var(--dsw-alias-border-${tone});margin:9px 0"></div>`
  return `
<div style="position:absolute;inset:0;display:flex">
  <div style="width:150px;background:var(--dsw-specific-sidebar-fill);padding:22px 16px;box-sizing:border-box">
    ${line(70)}${line(85, 'l1')}${line(60, 'l1')}${line(75, 'l1')}
  </div>
  <div style="flex:1;position:relative;padding:28px 40px;box-sizing:border-box">
    <div style="margin-left:auto;width:46%;padding:10px 14px;border-radius:14px;background:var(--dsw-alias-bg-layer-2)">${line(90)}${line(60)}</div>
    <div style="width:44%;margin-top:18px">${line(95)}${line(88)}${line(70)}</div>
    <div style="margin-top:14px;width:36%;padding:10px 14px;border-radius:10px;border:.5px solid var(--dsw-alias-state-warn-primary);background:var(--dsw-alias-bg-layer-1)">${line(80)}${line(40)}</div>
    <div style="position:absolute;left:40px;right:40px;bottom:22px;height:52px;border-radius:14px;border:.5px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);box-shadow:0 2px 10px rgba(0,0,0,.05)"></div>
  </div>
</div>
${overlay}`
}

function poseSheet(PetStage, skin) {
  const tiles = ACTIVITIES.map(activity => {
    const scene = {
      activity,
      helpers: activity === 'delegating' ? 2 : 0,
      ...(activity === 'tool' ? { tool: { name: 'bash', category: 'shell' } } : {}),
      ...(activity === 'awaiting' ? { awaiting: 'approval' } : {}),
    }
    const stage = render(PetStage, { skin, scene })
    return `<figure class="tile"><div class="scene"><div class="stage">${stage}</div></div><figcaption>${activity}</figcaption></figure>`
  }).join('')
  return `<div class="sheet">${tiles}</div>`
}

const POSE_CSS = `
.sheet{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;padding:16px;}
.tile{margin:0;border-radius:12px;overflow:hidden;border:.5px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);}
.scene{height:132px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:14px;box-sizing:border-box;
  background:radial-gradient(120% 70% at 50% 100%,color-mix(in srgb,var(--dsw-alias-brand-primary) 10%,transparent),transparent 70%),var(--dsw-alias-bg-layer-2);}
.stage{position:relative;width:100px;height:80px;transform:scale(1.15);transform-origin:50% 100%;}
.stage svg{display:block;width:100%;height:100%;overflow:visible;}
figcaption{padding:7px 0 8px;text-align:center;font:12px ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--dsw-alias-label-secondary);}
`

async function main() {
  mkdirSync(out, { recursive: true })
  const work = mkdtempSync(join(tmpdir(), 'workpet-shots-'))
  const shots = []
  const shot = (name, width, height, html) => {
    const file = join(work, `${name}.html`)
    writeFileSync(file, html)
    shots.push({ name, width, height, file })
  }

  for (const language of ['en', 'zh']) {
    const runtime = boot(language)
    const t = runtime.t('workpet')
    const hook = value => selector => selector(value)
    const Overlay = runtime.slot('shell.overlay')[0].component
    const overlay = render(Overlay, {
      t,
      useSessions: hook({ byId: { s1: { id: 's1', displayTitle: 'Refactor', running: true, retainedBy: { mainView: 1 } } } }),
      useSessionStatus: hook(new Map([['s1', { running: true, pendingInteraction: { kind: 'approval' } }]])),
      usePanelInfo: hook({ activePanelId: null }),
    })
    shot(`pets-on-screen.${language}`, 720, 340, page(720, 340, appWindow(overlay)))

    const Page = runtime.slot('plugins.bundle.config')[0].component
    const config = withPreviewChoice('tool', 'web', () => render(Page, { t, view: 'page' }))
    shot(`config-page.${language}`, 800, 720, page(800, 720, `<main style="padding:24px 32px">${config}</main>`))
  }

  const PetStage = await loadPetStage()
  const runtime = boot('en')
  const skins = runtime.services.get('workpet').getSnapshot().skins
  for (const [id, name] of [['cat', 'kitten-poses'], ['cockatiel', 'cockatiel-poses']]) {
    const skin = skins.find(entry => entry.id === id)
    if (skin === undefined) throw new Error(`skin ${id} did not register`)
    shot(name, 1000, 548, page(1000, 548, poseSheet(PetStage, skin), POSE_CSS))
  }

  for (const { name, width, height, file } of shots) {
    const target = join(out, `${name}.png`)
    execFileSync(chrome, [
      '--headless=new', '--disable-gpu', '--no-first-run', '--hide-scrollbars', `--user-data-dir=${join(work, 'profile')}`,
      '--force-device-scale-factor=2', `--window-size=${width},${height}`, '--virtual-time-budget=2500',
      `--screenshot=${target}`, `file://${file}`,
    ], { stdio: 'ignore' })
    console.log(`wrote ${target.slice(root.length + 1)}`)
  }
  rmSync(work, { recursive: true, force: true })
}

await main()
