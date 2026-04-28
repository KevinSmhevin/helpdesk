import 'dotenv/config'
import prisma from '../src/lib/prisma.ts'

async function main() {
  await prisma.$executeRaw`TRUNCATE TABLE "ticket" CASCADE`
  await prisma.$executeRaw`TRUNCATE TABLE "verification" CASCADE`
  await prisma.$executeRaw`TRUNCATE TABLE "account" CASCADE`
  await prisma.$executeRaw`TRUNCATE TABLE "session" CASCADE`
  await prisma.$executeRaw`TRUNCATE TABLE "user" CASCADE`
  console.log('Test database truncated')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
