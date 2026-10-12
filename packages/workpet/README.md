# workpet/ — work pet capability family

Floating pets that mirror the main-view Session: one per enabled appearance.

| Package | Role | ctx key |
|---|---|---|
| [`workpet/`](workpet/README.md) (`dsh-workpet`) | Service Definition (skin registry, vocabulary types) and Consumer (one overlay pet per skin, Chat probe, appearance cards and action preview); bundle | provides `ctx.workpet` |
| [`workpet-cat/`](workpet-cat/README.md) (`dsh-workpet-cat`) | Service Provider: the default kitten; ships inside the `dsh-workpet` bundle as a dependency | registers on `ctx.workpet` |

Providers outside this repository (for example `dsh-workpet-parrot`) register the same way. See [docs/architecture.md](../../docs/architecture.md).
