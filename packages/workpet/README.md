# workpet/ — work pet capability family

A floating pet that mirrors the main-view Session, with swappable appearances.

| Package | Role | ctx key |
|---|---|---|
| [`workpet/`](workpet/README.md) (`dsh-workpet`) | Service Definition (skin registry, selection, vocabulary types) and Consumer (overlay, Chat probe, appearance dropdown); bundle | provides `ctx.workpet` |
| [`workpet-cat/`](workpet-cat/README.md) (`dsh-workpet-cat`) | Service Provider: the default kitten; ships inside the `dsh-workpet` bundle as a dependency | registers on `ctx.workpet` |

Providers outside this repository (for example `dsh-workpet-parrot`) register the same way. See [docs/architecture.md](../../docs/architecture.md).
