import { execSync } from 'child_process'
import { resolve } from 'path'

const serverDir = resolve(__dirname, '../server')

export default async function globalSetup() {
  execSync('bunx prisma migrate deploy', { cwd: serverDir, stdio: 'inherit' })
  execSync('bun prisma/seed-test.ts', { cwd: serverDir, stdio: 'inherit' })
}
