/**
 * Release helper for the packages this repository publishes. All published
 * packages share one version and are released together from one `vX.Y.Z` tag.
 *
 *   node scripts/release.mjs version <x.y.z>   set the version of the root and every published package
 *   node scripts/release.mjs check [<x.y.z>]   fail unless every published package has that version
 *                                              (default: the root version), its build output, a LICENSE,
 *                                              and `workspace:` ranges only toward published packages
 *   node scripts/release.mjs check --packed    as above, and fail on any remaining `workspace:` range or
 *                                              relative README link (each package's prepublishOnly runs this)
 *   node scripts/release.mjs prepare [--dry-run]
 *                                              make the published packages npm-ready in the checkout:
 *                                              replace `workspace:` ranges with real ranges, and write the
 *                                              npm READMEs (README_FROM_ROOT packages get the repository's
 *                                              root README; relative links become GitHub URLs). release.yml
 *                                              runs this before staging; `pin` is an alias.
 *   node scripts/release.mjs list              print the published package directories, one per line
 *   node scripts/release.mjs publish [args]    verify, prepare, run `npm publish [args]` in every published
 *                                              package in order, then restore the changed files (manual
 *                                              publishing only; releases use release.yml)
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * Published packages, in publish order: a package comes after every
 * published package it depends on (the default kitten before the capability
 * that depends on it).
 */
export const PUBLISHED = ['packages/workpet/workpet-cat', 'packages/workpet/workpet']

/** Packages whose npm page shows the repository's root README instead of their own. */
export const README_FROM_ROOT = new Set(['packages/workpet/workpet'])

/** GitHub web URL of this repository, used to make README links work on npmjs.com. */
export const REPOSITORY_URL = 'https://github.com/lastorder/dsh-workpet'

const README_FILES = ['README.md', 'README.zh.md']
const RELATIVE_LINK = /\]\((?!https?:|#|mailto:)([^)\s]+)\)/g

const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/
const DEPENDENCY_FIELDS = ['dependencies', 'peerDependencies', 'optionalDependencies', 'devDependencies']

/**
 * Replace `workspace:` ranges with the ranges npm consumers need.
 * `workspace:^` → `^<version>`, `workspace:~` → `~<version>`, `workspace:*` → `<version>`,
 * `workspace:<range>` → `<range>`.
 * @param {Record<string, any>} manifest - parsed package.json; not modified.
 * @param {ReadonlyMap<string, string>} versions - published package name → version.
 * @returns {{ manifest: Record<string, any>, pinned: string[], problems: string[] }} the rewritten copy,
 *   the rewrites made, and the ranges that point at an unpublished package.
 */
export function pinManifest(manifest, versions) {
  const copy = structuredClone(manifest)
  const pinned = []
  const problems = []
  for (const field of DEPENDENCY_FIELDS) {
    for (const [name, range] of Object.entries(copy[field] ?? {})) {
      if (typeof range !== 'string' || !range.startsWith('workspace:')) continue
      const version = versions.get(name)
      if (version === undefined) {
        problems.push(`${manifest.name} ${field}.${name} is ${range}, but ${name} is not published from this repository`)
        continue
      }
      const spec = range.slice('workspace:'.length)
      const next = spec === '^' ? `^${version}` : spec === '~' ? `~${version}` : spec === '*' || spec === '' ? version : spec
      copy[field][name] = next
      pinned.push(`${manifest.name} ${field}.${name}: ${range} -> ${next}`)
    }
  }
  return { manifest: copy, pinned, problems }
}

/**
 * Make every relative Markdown link absolute, so it works where the file is
 * shown outside the repository (npmjs.com). Anchors survive; `#anchor`,
 * `http(s):`, and `mailto:` links are left alone.
 * @param {string} markdown - README text.
 * @param {string} baseUrl - URL of the directory the links are relative to, ending in `/`.
 * @returns {string} the rewritten text.
 */
export function absolutizeLinks(markdown, baseUrl) {
  return markdown.replace(RELATIVE_LINK, (_, target) => `](${new URL(target, baseUrl).href})`)
}

/**
 * @param {string} markdown - README text.
 * @returns {string[]} relative link targets left in the text.
 */
export function relativeLinks(markdown) {
  return [...markdown.matchAll(RELATIVE_LINK)].map(match => match[1])
}

/**
 * The README files npm should show for one published package.
 * @param {string} dir - package directory relative to the repository root.
 * @param {string} ref - git ref the GitHub links point at (a release tag or `main`).
 * @returns {Map<string, string>} absolute file path in the package → npm-ready content.
 */
export function npmReadmes(dir, ref) {
  const fromRoot = README_FROM_ROOT.has(dir)
  const sourceDir = fromRoot ? '.' : dir
  const baseUrl = `${REPOSITORY_URL}/blob/${ref}/${sourceDir === '.' ? '' : `${sourceDir}/`}`
  const files = new Map()
  for (const name of README_FILES) {
    const source = join(root, sourceDir, name)
    if (!existsSync(source)) continue
    files.set(join(root, dir, name), absolutizeLinks(readFileSync(source, 'utf8'), baseUrl))
  }
  return files
}

/** @returns {string} the tag being released in CI, else `main`. */
function linkRef() {
  const tag = process.env.GITHUB_REF_NAME
  return tag !== undefined && /^v\d/.test(tag) ? tag : 'main'
}

function manifestPath(dir) {
  return join(root, dir, 'package.json')
}

function readManifest(dir) {
  return JSON.parse(readFileSync(manifestPath(dir), 'utf8'))
}

function writeManifest(dir, manifest) {
  writeFileSync(manifestPath(dir), `${JSON.stringify(manifest, null, 2)}\n`)
}

function fail(message) {
  console.error(`release: ${message}`)
  process.exit(1)
}

function publishedVersions() {
  return new Map(PUBLISHED.map(dir => {
    const manifest = readManifest(dir)
    return [manifest.name, manifest.version]
  }))
}

/**
 * Pin `workspace:` ranges and write npm READMEs in place (or only report with `dryRun`).
 * @returns {Map<string, string>} absolute file path → original text of every file changed.
 */
function prepare(dryRun) {
  const versions = publishedVersions()
  const ref = linkRef()
  const originals = new Map()
  const problems = []
  const change = (file, next) => {
    const text = readFileSync(file, 'utf8')
    if (text === next) return
    if (!originals.has(file)) originals.set(file, text)
    writeFileSync(file, next)
  }
  for (const dir of PUBLISHED) {
    const result = pinManifest(readManifest(dir), versions)
    problems.push(...result.problems)
    for (const line of result.pinned) console.log(`${dryRun ? 'would pin' : 'pinned'} ${line}`)
    if (!dryRun && result.pinned.length > 0) change(manifestPath(dir), `${JSON.stringify(result.manifest, null, 2)}\n`)
    for (const [file, content] of npmReadmes(dir, ref)) {
      const source = README_FROM_ROOT.has(dir) ? 'the root README' : 'its own README'
      console.log(`${dryRun ? 'would write' : 'wrote'} ${file.slice(root.length + 1)} from ${source} (links -> ${ref})`)
      if (!dryRun) change(file, content)
    }
  }
  if (problems.length > 0) {
    restore(originals)
    fail(problems.join('\n  '))
  }
  return originals
}

/** @param {Map<string, string>} originals - absolute file path → text to write back. */
function restore(originals) {
  for (const [file, text] of originals) writeFileSync(file, text)
}

function check(expected, packed) {
  const versions = publishedVersions()
  const problems = []
  for (const dir of PUBLISHED) {
    const manifest = readManifest(dir)
    if (manifest.version !== expected) problems.push(`${manifest.name} is ${manifest.version}, expected ${expected}`)
    if (manifest.private === true) problems.push(`${manifest.name} is private`)
    for (const output of ['lib/index.js', 'lib/client.js']) {
      if (!existsSync(join(root, dir, output))) problems.push(`${manifest.name} is missing ${output}; run pnpm run build`)
    }
    if (!existsSync(join(root, dir, 'LICENSE'))) problems.push(`${manifest.name} is missing LICENSE`)
    const { pinned, problems: unpublished } = pinManifest(manifest, versions)
    problems.push(...unpublished)
    if (packed && pinned.length > 0) {
      problems.push(`${manifest.name} still has workspace: ranges; publish through \`pnpm run release:publish\` or run \`node scripts/release.mjs prepare\` first`)
    }
    if (packed) {
      for (const name of README_FILES) {
        const file = join(root, dir, name)
        if (!existsSync(file)) continue
        const links = relativeLinks(readFileSync(file, 'utf8'))
        if (links.length > 0) problems.push(`${manifest.name} ${name} has relative links (${links.join(', ')}) that break on npm; run \`node scripts/release.mjs prepare\` first`)
      }
      if (README_FROM_ROOT.has(dir)) {
        const title = text => text.split('\n', 1)[0]
        if (title(readFileSync(join(root, dir, 'README.md'), 'utf8')) !== title(readFileSync(join(root, 'README.md'), 'utf8'))) {
          problems.push(`${manifest.name} README.md is not the root README; run \`node scripts/release.mjs prepare\` first`)
        }
      }
    }
  }
  if (problems.length > 0) fail(problems.join('\n  '))
  console.log(`release check passed for ${expected}: ${PUBLISHED.map(dir => readManifest(dir).name).join(', ')}`)
}

function main(args) {
  const [command, ...rest] = args
  switch (command) {
    case 'version': {
      const [version] = rest
      if (version === undefined || !SEMVER.test(version)) fail('usage: release.mjs version <x.y.z>')
      for (const dir of ['.', ...PUBLISHED]) {
        const manifest = readManifest(dir)
        manifest.version = version
        writeManifest(dir, manifest)
      }
      console.log(`set version ${version} on the root and ${PUBLISHED.length} packages`)
      break
    }
    case 'check': {
      const packed = rest.includes('--packed')
      const version = rest.find(arg => !arg.startsWith('--'))
      check(version ?? readManifest('.').version, packed)
      break
    }
    case 'prepare':
    case 'pin':
      prepare(rest.includes('--dry-run'))
      break
    case 'list':
      for (const dir of PUBLISHED) console.log(dir)
      break
    case 'publish': {
      execFileSync('pnpm', ['run', 'verify'], { cwd: root, stdio: 'inherit' })
      const originals = prepare(false)
      try {
        // stdio is inherited so npm can prompt for the 2FA one-time password.
        for (const dir of PUBLISHED) {
          console.log(`\n== npm publish ${rest.join(' ')} in ${dir}`)
          execFileSync('npm', ['publish', ...rest], { cwd: join(root, dir), stdio: 'inherit' })
        }
      } finally {
        restore(originals)
      }
      break
    }
    default:
      fail('usage: release.mjs version <x.y.z> | check [<x.y.z>] [--packed] | prepare [--dry-run] | list | publish [npm args]')
  }
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main(process.argv.slice(2))
}
