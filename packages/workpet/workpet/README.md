# dsh-workpet

English | [中文](README.zh.md)

The work pet capability for DeepSeek Harness, and the bundle you install.

## Summary

- **Service Definition** — provides `ctx.workpet` (`WorkpetService`): register appearances (`WorkpetSkin`), store the user's selection, publish an immutable snapshot. Types are published as `dsh-workpet/contract`.
- **Consumer** — a draggable pet in `shell.overlay` that mirrors the main-view Session; an invisible probe in `conversation.composer.dock` that reads live Chat activity; a section on this bundle's Plugin Manager page (`plugins.bundle.config`, key `dsh-workpet`) with the **Appearance** dropdown and a live preview.
- **Bundle** — `cordis.patch.yml` inserts the rows `dsh-workpet` and `dsh-workpet-cat`, and `dsh-workpet-cat` is a dependency, so installing this bundle brings the default kitten. On DeepSeek Harness 0.2.0, restart once after the first install so the kitten row resolves.

## Exports

| Entry | Content |
|---|---|
| `.` | Host half (`lib/index.js`): no behavior; the Loader row that serves the Client half |
| `./client` | Client half (`lib/client.js`): `inject = ['slots', 'locale']`, `apply(ctx)` |
| `./contract` | Types only: `WorkpetActivity`, `WorkpetScene`, `WorkpetSkin`, `WorkpetFigureProps`, `WorkpetService`, `WorkpetSnapshot`, `WorkpetProviderContext` |

## Behavior

- The selection is stored in `localStorage` (`dsh-workpet:skin`) and followed across tabs. An unregistered selection falls back to the first skin by `order` without being forgotten.
- The pet's position is stored in `localStorage` (`dsh-workpet:position`) and clamped to the window.
- A skin whose Figure throws is contained by an error boundary.
- The activity rules and timings are listed in [docs/architecture.md](../../../docs/architecture.md#activity-precedence).

## Limitations

- Mirrors only the main-view Session.
- Reads the Chat target's `legacy` compatibility slice for live activity.
- No Host configuration: timings are constants in `src/client/overlay.tsx`.
