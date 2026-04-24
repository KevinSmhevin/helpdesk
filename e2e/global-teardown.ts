import { execSync } from 'child_process'
import { resolve } from 'path'

const serverDir = resolve(__dirname, '../server')

export default async function globalTeardown() {
  execSync('bun prisma/teardown.ts', { cwd: serverDir, stdio: 'inherit' })
}
