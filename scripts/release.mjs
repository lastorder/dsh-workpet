/**
 * Release helper for the packages this repository publishes. All published
 * packages share one version and are released together from one `vX.Y.Z` tag.
 *
 *   node scripts/release.mjs version <x.y.z>   set the version of the root and every published package
 *   node scripts/release.mjs check [<x.y.z>]   fail unless every published package has that version
 *                                              (default: the root version), its build output, a LICENSE,
 *                                              and `workspace:` ranges only toward published packages
 *   node scripts/release.mjs check --packed    as above, and fail on any remaining `workspace:` range
 *                                              (each package's prepublishOnly runs this)
 *   node scripts/release.mjs pin [--dry-run]   replace `workspace:` ranges in the published manifests with
 *                                              real ranges (release.yml runs this before staging)
 *   node scripts/release.mjs list              print the published package directories, one per line
 *   node scripts/release.mjs publish [args]    verify, pin, run `npm publish [args]` in every published
 *                                              package in order, then restore the manifests (the one-time
 *                                              manual first publish; releases use release.yml)
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

/** @returns {Map<string, string>} directory → original package.json text, after pinning in place. */
function pinAll(dryRun) {
  const versions = publishedVersions()
  const originals = new Map()
  const problems = []
  for (const dir of PUBLISHED) {
    const text = readFileSync(manifestPath(dir), 'utf8')
    const result = pinManifest(JSON.parse(text), versions)
    problems.push(...result.problems)
    for (const line of result.pinned) console.log(`${dryRun ? 'would pin' : 'pinned'} ${line}`)
    if (!dryRun && result.pinned.length > 0) {
      originals.set(dir, text)
      writeManifest(dir, result.manifest)
    }
  }
  if (problems.length > 0) {
    for (const [dir, text] of originals) writeFileSync(manifestPath(dir), text)
    fail(problems.join('\n  '))
  }
  return originals
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
      problems.push(`${manifest.name} still has workspace: ranges; publish through \`pnpm run release:publish\` or run \`node scripts/release.mjs pin\` first`)
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
    case 'pin':
      pinAll(rest.includes('--dry-run'))
      break
    case 'list':
      for (const dir of PUBLISHED) console.log(dir)
      break
    case 'publish': {
      execFileSync('pnpm', ['run', 'verify'], { cwd: root, stdio: 'inherit' })
      const originals = pinAll(false)
      try {
        // stdio is inherited so npm can prompt for the 2FA one-time password.
        for (const dir of PUBLISHED) {
          console.log(`\n== npm publish ${rest.join(' ')} in ${dir}`)
          execFileSync('npm', ['publish', ...rest], { cwd: join(root, dir), stdio: 'inherit' })
        }
      } finally {
        for (const [dir, text] of originals) writeFileSync(manifestPath(dir), text)
      }
      break
    }
    default:
      fail('usage: release.mjs version <x.y.z> | check [<x.y.z>] [--packed] | pin [--dry-run] | list | publish [npm args]')
  }
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main(process.argv.slice(2))
}
