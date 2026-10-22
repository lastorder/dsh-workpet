# Architecture

English | [中文](architecture.zh.md)

dsh-workpet turns "a pet that shows what the Session is doing" into a **capability** of DeepSeek Harness, built the same way the Harness builds its own capabilities (model providers, shell executors, filesystem access): one capability with three roles, each role in its own npm package when the roles evolve independently.

## Table of Contents

- [Capability roles](#capability-roles)
- [Packages and composition](#packages-and-composition)
- [The interface](#the-interface)
- [Data flow](#data-flow)
- [Activity precedence](#activity-precedence)
- [Pets on screen and the configuration page](#pets-on-screen-and-the-configuration-page)
- [Writing a new appearance](#writing-a-new-appearance)
- [Limitations](#limitations)

-----

<a id="capability-roles"></a>
## Capability roles

| Role | What it owns | Package |
|---|---|---|
| **Service Definition** | `ctx.workpet` (`WorkpetService`): the skin registry and the vocabulary types (`WorkpetScene`, `WorkpetSkin`, …) | `dsh-workpet` |
| **Service Provider** | One appearance: a `WorkpetSkin` whose `Figure` draws the creature for any scene | `dsh-workpet-cat` (default), `dsh-workpet-parrot` (separate repository), any third party |
| **Consumer** | Reads the main-view Session, derives one `WorkpetScene` per render, and draws one pet per registered skin; also the Chat probe that feeds them and the configuration page (appearance cards, action preview) | `dsh-workpet` |

The Definition and the Consumer share one package because they are one concern: the registry exists to feed the floating pets and the configuration page. There is no selection: a skin is on screen exactly while its plugin is enabled, so the Plugin Manager's switches are the only control. Providers depend on the Definition only through types; at runtime they receive `ctx.workpet` by dependency injection and never import its code.

```mermaid
flowchart LR
  subgraph def["dsh-workpet (Definition + Consumer)"]
    R["ctx.workpet<br/>WorkpetRegistry"]
    O["shell.overlay<br/>one pet per skin"]
    PR["conversation.composer.dock<br/>Chat probe"]
    CP["plugins.bundle.config<br/>appearance cards + action preview"]
  end
  CAT["dsh-workpet-cat<br/>(default skin)"] -- "register(skin)" --> R
  PAR["dsh-workpet-parrot<br/>(another bundle)"] -- "register(skin)" --> R
  R -- "skins" --> O
  R -- "skins" --> CP
  PR -- "ChatSignal" --> O
```

<a id="packages-and-composition"></a>
## Packages and composition

Packages live at `packages/<group>/<package>/`; the `workpet` group holds this capability family.

| Package | Loader row | Host half | Client half |
|---|---|---|---|
| `dsh-workpet` | `dsh-workpet` | no-op `apply` | provides `ctx.workpet`; registers the overlay, the probe, and the configuration page |
| `dsh-workpet-cat` | `dsh-workpet-cat` | no-op `apply` | `inject = ['workpet', 'locale']`; registers skin `cat` |

`dsh-workpet` is the **bundle**: its `cordis.patch.yml` inserts both rows, and its `package.json` declares `dsh-workpet-cat` as a dependency. DeepSeek Harness resolves row names from the profile plus the dependency closure of every selected bundle, resolved from each bundle's own directory, so installing `dsh-workpet` makes `dsh-workpet-cat` resolvable without a second install. `dsh-workpet-cat` is not a bundle itself: two bundles inserting the same row id would conflict. The kitten stands in the default corner because its `order` (0) sorts first; switching its row off on the bundle page removes it and leaves the other appearances. Third-party appearances are separate bundles.

DeepSeek Harness 0.2.0 computes that package table only at start-up, so the kitten row resolves after one restart following the first install; 0.2.1 refreshes it after every install.

Both Host halves are empty. A Client half reaches the browser only when a Loader row names its package, so each package keeps a row.

Two independent edges keep start-up order correct:

- `dsh.client.inject: ["dsh-workpet"]` in a provider's `package.json` makes the module table deliver the capability's factory first.
- `export const inject = ['workpet', ...]` in the provider's Client half makes Cordis activate the provider only while `ctx.workpet` exists, and dispose it when the capability goes away.

<a id="the-interface"></a>
## The interface

The complete contract is `packages/workpet/workpet/src/client/contract.ts`, published as the type-only entry `dsh-workpet/contract`.

```ts
type WorkpetActivity =
  | 'absent' | 'idle' | 'sleeping' | 'thinking' | 'writing' | 'tool' | 'retrying'
  | 'awaiting' | 'delegating' | 'done' | 'error' | 'petted' | 'dragged'

interface WorkpetScene {
  readonly activity: WorkpetActivity
  readonly tool?: { readonly name: string; readonly category: WorkpetToolCategory } // when 'tool'
  readonly awaiting?: 'approval' | 'question' | 'plan-review' | 'other'               // when 'awaiting'
  readonly helpers: number                                                            // running child agents
}

interface WorkpetSkin {
  readonly id: string        // stable, [a-z0-9-]+; the pet's screen position is stored by id
  readonly order?: number    // arrangement: on screen from the corner leftwards, and on the page
  title(): string            // localized, read at render time
  description?(): string
  readonly Figure: ComponentType<{ scene: WorkpetScene; compact?: boolean }>
}

interface WorkpetService {            // ctx.workpet
  readonly stage: { width: 100; height: 80 }
  register(skin: WorkpetSkin): () => void   // the pet appears; the disposer removes it
  getSnapshot(): { skins }                  // every registered skin, in order
  subscribe(listener: () => void): () => void
}
```

Responsibilities are split so every appearance gets the same behavior:

- A **Figure** draws only the creature, into `viewBox="0 0 100 80"`, for every activity. It may simplify itself when `compact` is set (helper companions, previews).
- The **Consumer** owns each pet's position, dragging, petting, the status bubble, the tool badge (💻 🔍 ✏️ 🌐 🤝 📋 ❓ 🔧), helper companions (up to two small copies of the same Figure), and effects: hearts, sparkles, `z`, `!`, `?`, `…`, `↻`.
- A Figure that throws is contained by an error boundary; the slot and the rest of the page keep working.

<a id="data-flow"></a>
## Data flow

1. **Probe** (`conversation.composer.dock`, Session scope, renders nothing). Reads the Session's Chat target through the standard `useChat` hook — `legacy.runningCalls`, `legacy.partial`, `legacy.nodes` — and publishes a `ChatSignal`: the live activity (tool, retrying, writing, thinking) and whether the newest settled node is a turn error.
2. **Overlay** (`shell.overlay`, root scope). Reads the standard `useSessions`, `useSessionStatus`, and `usePanelInfo` hooks: the main-view Session is the one whose `retainedBy.mainView` count is positive; `running` and `pendingInteraction` come from its status; helpers are the running entries of its `subagentCatalog` projection. It joins these facts with the probe's signal and local interaction state and calls `deriveScene`.
3. **Skins**. The overlay renders one pet per entry of `snapshot.skins`. The pets share the Session facts (running, waiting, the turn-end celebration, dozing off); each pet adds its own dragging and petting, so dragging the kitten makes only the kitten dangle.

The plugin adds no Host service, no network request, and no session event; it reads the same Client state the conversation view renders.

<a id="activity-precedence"></a>
## Activity precedence

`deriveScene` (`src/client/scene.ts`) applies the first matching rule:

| # | Condition | Activity |
|---|---|---|
| 1 | No main-view Session | `absent` |
| 2 | The user is dragging the pet | `dragged` |
| 3 | Clicked within 1.6 s, and the Session is neither running nor waiting | `petted` |
| 4 | `pendingInteraction` is set | `awaiting` (`approval` / `question` / `plan-review` / `other`) |
| 5 | Running, probe sees a running tool call | `tool` |
| 6 | Running, newest settled node is a scheduled retry | `retrying` |
| 7 | Running, the streaming step has visible text or reasoning | `writing` |
| 8 | Running otherwise | `thinking` |
| 9 | Idle with running child agents | `delegating` |
| 10 | Just stopped (6 s) | `done` |
| 11 | Just stopped with a turn error (10 s) | `error` |
| 12 | Idle for 70 s | `sleeping` |
| 13 | Otherwise | `idle` |

The status bubble shows on hover. For `awaiting`, `done`, and `error` it stays visible under every pet, so each pet says it wherever it stands; default slots are far enough apart that the bubbles do not overlap.

<a id="pets-on-screen-and-the-configuration-page"></a>
## Pets on screen and the configuration page

Every registered skin is a pet on screen. Installing or enabling an appearance plugin adds a pet without any setting; switching it off removes the pet at once, because the registration lives in the provider's `ctx.effect`. The default kitten is the `dsh-workpet-cat` row on the **Work Pet** bundle page; other appearances are bundles of their own.

Each pet keeps its own position in `localStorage` under `dsh-workpet:position:<skin id>`, clamped to the window. A pet that was never moved takes a default slot: the first one in `order` stands in the bottom-right corner, the next ones line up 150 px apart to its left. The first pet also reads `dsh-workpet:position`, the single key earlier versions used, so an existing kitten stays where it was.

The bundle page in **Plugins → Work Pet** carries a section contributed through the `plugins.bundle.config` slot, keyed by the package name `dsh-workpet`:

- **appearance cards**, one per registered skin in `order`, each a small stage with the skin's name, description, and a status bubble, followed by a card that explains how to add more pets and links to the dsh-workpet-parrot repository (or, with no skin, how to bring the kitten back); a **GitHub** link next to the title opens this repository;
- an **action preview**: every activity as a button, grouped into everyday, working, needs you, turn ends, and interaction. Pressing one highlights it and makes every card act it out; the tool button adds a row of tool families that switches the badge. The catalogue is `src/client/preview.ts`.

<a id="writing-a-new-appearance"></a>
## Writing a new appearance

A third-party provider is a bundle with one Loader row and a Client half (the default kitten is the exception: it ships inside the `dsh-workpet` bundle). It can take either form:

- **Compiled** (like `dsh-workpet-cat`): TypeScript/TSX sources, `import type` from `dsh-workpet/contract`, built by `scripts/build.mjs`.
- **No build** (like [`dsh-workpet-parrot`](https://github.com/lastorder/dsh-workpet-parrot), a separate repository and the recommended template): one hand-written `client.js` that calls `window.__ModuleLoader__.load` itself, uses `React.createElement`, and draws with SVG markup strings. Its README is a step-by-step guide to drawing a skin.

Either way:

1. `package.json`: `dsh.bundle.patch`, a `./client` export, and `dsh.client.inject: ["dsh-workpet"]`.
2. `cordis.patch.yml`: insert one row named after the package.
3. Client half:

   ```ts
   import type { WorkpetProviderContext, WorkpetSkin } from 'dsh-workpet/contract'

   export const inject = ['workpet', 'locale']

   export function apply(ctx: WorkpetProviderContext): void {
     ctx.effect(() => ctx.locale.register('mySkin', { en, zh }))
     const t = ctx.locale.bind('mySkin')
     const skin: WorkpetSkin = { id: 'axolotl', order: 20, title: () => t('title'), Figure: AxolotlFigure }
     ctx.effect(() => ctx.workpet.register(skin))
   }
   ```

4. The Client half must be a classic script that calls `window.__ModuleLoader__.load({ id: '<package name>', factory })`; `react` and `react/jsx-runtime` arrive through the factory's `require` and are never bundled. `scripts/build.mjs` emits this format from sources; a no-build skin writes it directly.
5. Draw every activity; give gradient and clip ids per instance (`useId`), because companions render several Figures at once; prefix CSS classes and honor `prefers-reduced-motion`.

<a id="limitations"></a>
## Limitations

- The pet mirrors only the main-view Session.
- Tool categories come from tool-name patterns, not from tool metadata.
- `legacy` is the Chat target's compatibility slice; if a future Harness drops it, the probe reports nothing and a running Session shows `thinking` until the probe is updated.
- Positions live in the browser's `localStorage`, so each browser profile (and a Desktop window served from a different origin) keeps its own.
- Timings (petting, celebration, sleep) are constants in `overlay.tsx`; the Host half has no configuration channel to the browser.
