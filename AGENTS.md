# AGENTS.md

dsh-workpet is a DeepSeek Harness plugin family laid out like the Harness monorepo. Read [docs/architecture.md](docs/architecture.md) before changing `packages/`. This file covers *where a change goes* and *how to ship it*; README.md owns what the plugin does for users.

## Layout

```
packages/<group>/<package>/   one npm package each
  src/index.ts                Host half (built to lib/index.js)
  src/client/                 Client half (built to lib/client.js, a __ModuleLoader__ factory)
  tests/                      *.test.ts (pure, run by node --test) and *.test.mjs (built bundles)
  locale/*.json, icon.svg     Plugin Manager display metadata
  LICENSE                     copy of the root LICENSE (npm only packs files inside the package)
scripts/build.mjs             shared build for every package
scripts/release.mjs           published-package list, version bump, release check, workspace-range pinning
scripts/testing/              harness that loads built Client halves
docs/                         architecture (English + 中文)
.github/workflows/            ci.yml (verify on push/PR), release.yml (tag → npm stage + GitHub Release)
```

Related repository: [dsh-workpet-parrot](https://github.com/lastorder/dsh-workpet-parrot), a no-build appearance and the template for new pets. A contract change here must be checked against it.

## Commands

```sh
pnpm install
pnpm run build
pnpm run typecheck
pnpm run test           # needs a prior build: *.test.mjs load lib/client.js
pnpm run verify         # build + typecheck + test
pnpm run release:check  # every published package has the root version and its build output
node scripts/release.mjs pin --dry-run   # show how workspace: ranges will be pinned at publish time
pnpm run release:version <x.y.z>
pnpm run release:publish   # one-time manual first publish only; releases go through release.yml
```

## Conventions

- **Capability roles.** `ctx.workpet` is the Service Definition; skins are Service Providers; the floating pet is the Consumer. A change to `src/client/contract.ts` is a change to every provider, including ones in other repositories: update `docs/architecture.md` with it.
- **Providers never import runtime code** from `dsh-workpet` (compiled ones use `import type` from `dsh-workpet/contract`; no-build ones import nothing), declare `inject = ['workpet', ...]`, list `"dsh-workpet"` in `dsh.client.inject`, and register inside `ctx.effect`.
- **Bundles insert rows only for themselves and their `dependencies`.** DeepSeek Harness resolves row names from the profile plus the dependency closure of each selected bundle, so `dsh-workpet` ships the kitten by depending on `dsh-workpet-cat` and inserting its row. Never let two bundles insert the same row id: `dsh-workpet-cat` must not become a bundle again. `tests/manifest.test.mjs` enforces both. DeepSeek Harness 0.2.0 computes that package table only at start-up, so after the first install of a bundle with new dependencies, restart the app once.
- **Registrations are effects.** Every style tag, listener, dictionary, slot, and skin registration is owned by `ctx.effect`, `ctx.provide`, or `ctx.slots.inject`, so unloading a row removes it.
- **Client UI copy is locale-owned.** User-visible text goes through `ctx.locale` dictionaries (`zh` and `en`).
- **Theme tokens for chrome, literal colors for artwork.** Overlay and page styles use `--dsw-alias-*`; skin drawings may use their own palette.
- **No Harness Client package imports.** Only `react` and `react/jsx-runtime` come from the module table; `react` stays a peer dependency on the major the DSH page ships (18).
- **Local relative imports use `.ts`/`.tsx` extensions**; pure modules stay erasable TypeScript so `node --test` runs them directly.
- Files end with exactly one trailing newline.

## Releasing

Published packages are listed in `PUBLISHED` in [scripts/release.mjs](scripts/release.mjs): `dsh-workpet-cat`, then `dsh-workpet` (a dependency before the package that depends on it). They share **one version** and are released together from one `vX.Y.Z` tag. The root package is `private` and never published. `lib/` is not committed; CI builds it.

In the repository, `dsh-workpet` depends on `dsh-workpet-cat` as `workspace:^`, which npm cannot install. `node scripts/release.mjs pin` rewrites such ranges to the real version (`^X.Y.Z`) in the checkout before publishing; release.yml runs it, and `pnpm run release:publish` runs it and restores the manifests afterwards. Each package's `prepublishOnly` (`release.mjs check --packed`) refuses to publish while a `workspace:` range remains, so a bare `npm publish` in a package directory fails instead of shipping a broken dependency. Never commit pinned manifests.

### One-time setup, before the first tag

[release.yml](.github/workflows/release.yml) authenticates only through npm's token-free OIDC Trusted Publishing, which must be configured on packages that already exist. Do this once by hand (needs your npm login and 2FA):

1. From a clean checkout: `pnpm install && pnpm run verify && pnpm run release:check`.
2. `npm login`, then publish each package once, in `PUBLISHED` order. Run this from the repository root (a bare `npm publish` there is refused: the root is the private workspace package); it verifies, pins, publishes, and restores the manifests:
   ```sh
   pnpm run release:publish            # npm publish in packages/workpet/workpet-cat, then packages/workpet/workpet
   pnpm run release:publish --dry-run  # rehearsal; extra arguments are passed to npm publish
   ```
3. On npmjs.com, for **each** of `dsh-workpet` and `dsh-workpet-cat`: Settings → Trusted Publisher → GitHub Actions, repository `lastorder/dsh-workpet`, workflow file `.github/workflows/release.yml`, restricted to **stage-only**.

### Every release after that

1. `pnpm run release:version X.Y.Z` (sets the root and every published package).
2. `pnpm run verify && pnpm run release:check`.
3. Commit as `Release vX.Y.Z: <summary>` with a prose body; this message becomes the GitHub Release notes verbatim.
4. `git tag -a vX.Y.Z -m "Release vX.Y.Z"` and `git push origin main vX.Y.Z`.
5. release.yml verifies, checks the tag against every package version, pins `workspace:` ranges, runs `npm stage publish` in each package directory in `PUBLISHED` order, packs both tarballs, and creates a GitHub Release **marked pre-release**.
6. **Approve the stage**, `dsh-workpet-cat` first, because `dsh-workpet@X.Y.Z` depends on `dsh-workpet-cat@^X.Y.Z`: `https://www.npmjs.com/package/dsh-workpet-cat?activeTab=versions`, then `https://www.npmjs.com/package/dsh-workpet?activeTab=versions` (or `npm stage ls` / `npm stage approve`, 2FA). Then uncheck "pre-release" on the GitHub Release.

A release that changes `src/client/contract.ts` incompatibly needs a major version bump (a minor one while the version is `0.x`) and a note in the release commit body for provider authors; update dsh-workpet-parrot in the same round.

To add a package to the release, add its directory to `PUBLISHED` after its published dependencies, give it a `LICENSE` copy and the same `prepublishOnly`, and configure its Trusted Publisher after a first manual publish.

Do not run `npm publish` / `npm stage publish` by hand for an ordinary release; only to recover from a CI outage, after `pnpm run verify`. Keep the Trusted Publishers stage-only: the human approval is the control.

### CI/release infrastructure notes

- Third-party actions are pinned to a full commit SHA (`softprops/action-gh-release`); first-party `actions/*` and `pnpm/*` stay on major tags. Read Dependabot's diff before repinning.
- Dependabot groups action bumps and root tooling bumps into weekly PRs and ignores React majors, because the DSH page provides React 18.
