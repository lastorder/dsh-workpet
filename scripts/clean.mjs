/** Remove every package's generated `lib/` directory. */
import { existsSync, readdirSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const base = join(resolve(dirname(fileURLToPath(import.meta.url)), '..'), 'packages')
for (const group of readdirSync(base, { withFileTypes: true })) {
  if (!group.isDirectory()) continue
  for (const pkg of readdirSync(join(base, group.name), { withFileTypes: true })) {
    const lib = join(base, group.name, pkg.name, 'lib')
    if (pkg.isDirectory() && existsSync(lib)) rmSync(lib, { recursive: true, force: true })
  }
}
