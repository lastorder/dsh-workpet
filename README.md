# dsh-workpet

English | [中文](README.zh.md)

A floating **work pet** for DeepSeek Harness whose actions show what the current Session is doing: it thinks, types, runs off to use tools, waves when it needs you, celebrates when a turn finishes, and dozes off when nothing happens.

The pet is a **capability** with a defined interface, not a single drawing. `dsh-workpet` owns the interface and the behavior; appearances are separate npm packages that register into it. The default appearance is a cream-and-ginger kitten in a soft, hand-painted picture-book style. Other bundles can add more, and every registered appearance appears in a dropdown on the plugin's page.

## Table of Contents

- [Packages](#packages)
- [Install](#install)
- [Using it](#using-it)
- [Create your own pet](#create-your-own-pet)
- [Development](#development)
- [Documentation](#documentation)

-----

<a id="packages"></a>
## Packages

| Package | Role | Where |
|---|---|---|
| [`dsh-workpet`](packages/workpet/workpet/README.md) | Service Definition (`ctx.workpet`) + Consumer (floating pet, appearance dropdown); bundle | this repository |
| [`dsh-workpet-cat`](packages/workpet/workpet-cat/README.md) | Service Provider: the default kitten; installed with `dsh-workpet` | this repository |
| [`dsh-workpet-parrot`](https://github.com/lastorder/dsh-workpet-parrot) | Service Provider: a cockatiel, written as plain JavaScript with no build step; the template for new pets | separate repository |

See [docs/architecture.md](docs/architecture.md) for the roles, the interface, and the activity rules.

<a id="install"></a>
## Install

Installing the **`dsh-workpet`** bundle installs the default kitten with it: `dsh-workpet-cat` is a dependency of `dsh-workpet`, and the bundle inserts its row. Other appearances, such as `dsh-workpet-parrot`, are separate bundles.

From npm, in a Harness session, ask the agent to run `plugin_manager` `install_bundle`:

```text
install_bundle  dsh-workpet          # the pet and the default kitten
install_bundle  dsh-workpet-parrot   # optional cockatiel
```

From source, build first, then install the directories:

```sh
pnpm install
pnpm run build
```

```text
install_bundle  /absolute/path/to/dsh-workpet/packages/workpet/workpet   # the pet and the default kitten
install_bundle  /absolute/path/to/dsh-workpet-parrot                     # optional cockatiel
```

For a CLI-managed profile (not the Desktop app's `desktop` profile, which only the app may change), use `dsh plugin --profile <profile> add dsh-workpet` (or `add link:/absolute/path/to/dsh-workpet/packages/workpet/workpet`), and the same for `dsh-workpet-parrot`.

Then refresh the Harness window. On DeepSeek Harness 0.2.0 and earlier, **restart the app once after the first install**: those versions read a bundle's dependencies only at start-up, so the kitten row reports "failed to import" until the restart. Later versions pick it up immediately.


<a id="using-it"></a>
## Using it

- The pet floats in the bottom-right corner. Drag it anywhere; it remembers the position. Click it to pet it.
- Hover it to see what the Session is doing. The bubble stays visible while the Session waits for you, and right after a turn finishes or fails.
- **Plugins → Work Pet** shows the **Appearance** dropdown with every registered appearance, plus a **Preview activity** dropdown that shows the selected appearance in any state.

| Session state | Kitten |
|---|---|
| No session open | Sits with eyes closed |
| Idle | Sits, blinks, sways its tail |
| Idle for a while | Curls up asleep |
| Model thinking | Tilts its head and looks up |
| Model writing | Types on a little laptop |
| Tool running | Runs through drifting leaves, with a tool badge |
| Retrying a request | Dizzy spiral eyes |
| Waiting for approval / an answer / a plan review | Waves a paw |
| Subagents running | Watches its helper kittens |
| Turn finished | Jumps for joy |
| Turn failed | Droopy ears and a tear |
| Petted | Purrs with eyes closed |
| Being dragged | Dangles and kicks |

<a id="create-your-own-pet"></a>
## Create your own pet

Start from **[dsh-workpet-parrot](https://github.com/lastorder/dsh-workpet-parrot)**. It is a complete appearance in one plain-JavaScript file with no build step and no TypeScript, so almost everything you edit is the drawing itself:

1. Copy the repository and rename the package, the Loader row in `cordis.patch.yml`, the `id` in `window.__ModuleLoader__.load`, the skin `id`, and the `wpp-` CSS prefix.
2. Replace the artwork in `client.js`: a palette, body parts, and one pose per activity, as SVG markup in a 100 × 80 box. Its README lists every activity, the building blocks, and the animation rules.
3. Install it as its own bundle next to `dsh-workpet` with `install_bundle`, open **Plugins → Work Pet**, choose it in the **Appearance** dropdown, and step through **Preview activity**.

The interface the pet implements (`WorkpetSkin`, `WorkpetScene`, `ctx.workpet`) is described in [docs/architecture.md](docs/architecture.md#the-interface). A compiled TypeScript appearance follows [`dsh-workpet-cat`](packages/workpet/workpet-cat) instead.

<a id="development"></a>
## Development

```sh
pnpm run build       # every package: lib/index.js, lib/client.js (and lib/types for dsh-workpet)
pnpm run typecheck
pnpm run test        # pure scene/registry tests + smoke tests over the built bundles
pnpm run verify      # all three
```

Layout follows the DeepSeek Harness monorepo: packages live at `packages/<group>/<package>/`, and each package keeps a Host half (`src/index.ts`) and a Client half (`src/client/`). See [AGENTS.md](AGENTS.md) for conventions and the npm release procedure.

<a id="documentation"></a>
## Documentation

- [Architecture](docs/architecture.md): capability roles, the interface, data flow, activity precedence, writing a new appearance.
- [Package group map](packages/README.md).
