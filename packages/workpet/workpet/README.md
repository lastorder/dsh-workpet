# dsh-workpet

English | [中文](README.zh.md)

The work pet capability for DeepSeek Harness, and the bundle you install.

## Summary

- **Service Definition** — provides `ctx.workpet` (`WorkpetService`): register appearances (`WorkpetSkin`) and publish them as an immutable snapshot; every registered appearance is a pet on screen. Types are published as `dsh-workpet/contract`.
- **Consumer** — one draggable pet per registered skin in `shell.overlay`, all mirroring the main-view Session; an invisible probe in `conversation.composer.dock` that reads live Chat activity; a section on this bundle's Plugin Manager page (`plugins.bundle.config`, key `dsh-workpet`) with a card per appearance and an action preview: every activity is a button that makes every card act it out.
- **Bundle** — `cordis.patch.yml` inserts the rows `dsh-workpet` and `dsh-workpet-cat`, and `dsh-workpet-cat` is a dependency, so installing this bundle brings the default kitten. On DeepSeek Harness 0.2.0, restart once after the first install so the kitten row resolves.

## Exports

| Entry | Content |
|---|---|
| `.` | Host half (`lib/index.js`): no behavior; the Loader row that serves the Client half |
| `./client` | Client half (`lib/client.js`): `inject = ['slots', 'locale']`, `apply(ctx)` |
| `./contract` | Types only: `WorkpetActivity`, `WorkpetScene`, `WorkpetSkin`, `WorkpetFigureProps`, `WorkpetService`, `WorkpetSnapshot`, `WorkpetProviderContext` |

## Behavior

- Which pets are on screen follows the Plugin Manager: a skin is drawn exactly while its plugin is enabled. Switching the `dsh-workpet-cat` row off removes the kitten.
- Each pet's position is stored in `localStorage` (`dsh-workpet:position:<skin id>`) and clamped to the window. Pets never moved line up leftwards from the bottom-right corner in `order`; the first one also reads the older single key `dsh-workpet:position`.
- The pets share the Session's state; dragging and petting belong to each pet. Alerts keep the status bubble visible under every pet.
- A skin whose Figure throws is contained by an error boundary.
- The activity rules and timings are listed in [docs/architecture.md](../../../docs/architecture.md#activity-precedence).

## Limitations

- Mirrors only the main-view Session.
- Reads the Chat target's `legacy` compatibility slice for live activity.
- No Host configuration: timings are constants in `src/client/overlay.tsx`.
