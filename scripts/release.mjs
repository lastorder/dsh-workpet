/**
 * Release helper for the packages this repository publishes. All published
 * packages share one version and are released together from one `vX.Y.Z` tag.
 *
 *   node scripts/release.mjs version <x.y.z>   set the version of the root and every published package
 *   node scripts/release.mjs check [<x.y.z>]   fail unless every published package has that version
 *                                              (default: the root version) and its build output exists
 *   node scripts/release.mjs list              print the published package directories, one per line
 *   node scripts/release.mjs publish [args]    run `npm publish [args]` in every published package, in order
 *                                              (the one-time manual first publish; releases use release.yml)
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** Published packages, in publish order (the capability before its providers). */
export const PUBLISHED = ['packages/workpet/workpet', 'packages/workpet/workpet-cat']

const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/

function readManifest(dir) {
  return JSON.parse(readFileSync(join(root, dir, 'package.json'), 'utf8'))
}

function writeVersion(dir, version) {
  const file = join(root, dir, 'package.json')
  const manifest = JSON.parse(readFileSync(file, 'utf8'))
  manifest.version = version
  writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`)
}

function fail(message) {
  console.error(`release: ${message}`)
  process.exit(1)
}

const [command, argument] = process.argv.slice(2)
switch (command) {
  case 'version': {
    if (argument === undefined || !SEMVER.test(argument)) fail('usage: release.mjs version <x.y.z>')
    for (const dir of ['.', ...PUBLISHED]) writeVersion(dir, argument)
    console.log(`set version ${argument} on the root and ${PUBLISHED.length} packages`)
    break
  }
  case 'check': {
    const expected = argument ?? readManifest('.').version
    const problems = []
    for (const dir of PUBLISHED) {
      const manifest = readManifest(dir)
      if (manifest.version !== expected) problems.push(`${manifest.name} is ${manifest.version}, expected ${expected}`)
      if (manifest.private === true) problems.push(`${manifest.name} is private`)
      for (const output of ['lib/index.js', 'lib/client.js']) {
        if (!existsSync(join(root, dir, output))) problems.push(`${manifest.name} is missing ${output}; run pnpm run build`)
      }
      if (!existsSync(join(root, dir, 'LICENSE'))) problems.push(`${manifest.name} is missing LICENSE`)
    }
    if (problems.length > 0) fail(problems.join('\n  '))
    console.log(`release check passed for ${expected}: ${PUBLISHED.map(dir => readManifest(dir).name).join(', ')}`)
    break
  }
  case 'list':
    for (const dir of PUBLISHED) console.log(dir)
    break
  case 'publish': {
    // Each package's prepublishOnly re-runs verify and the release check;
    // stdio is inherited so npm can prompt for the 2FA one-time password.
    const extra = process.argv.slice(3)
    for (const dir of PUBLISHED) {
      console.log(`\n== npm publish ${extra.join(' ')} in ${dir}`)
      execFileSync('npm', ['publish', ...extra], { cwd: join(root, dir), stdio: 'inherit' })
    }
    break
  }
  default:
    fail('usage: release.mjs version <x.y.z> | check [<x.y.z>] | list | publish [npm args]')
}
