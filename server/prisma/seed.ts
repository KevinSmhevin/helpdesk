import 'dotenv/config'
import { hashPassword } from 'better-auth/crypto'
import prisma from '../src/lib/prisma.ts'
import { Role } from '@prisma/client'

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL
  const password = process.env.SEED_ADMIN_PASSWORD

  if (!email || !password) {
    throw new Error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set')
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log(`Admin ${email} already exists, skipping`)
    return
  }

  const id = crypto.randomUUID()
  const hashed = await hashPassword(password)

  await prisma.user.create({
    data: {
      id,
      name: 'Admin',
      email,
      emailVerified: true,
      role: Role.admin,
      accounts: {
        create: {
          id: crypto.randomUUID(),
          accountId: email,
          providerId: 'credential',
          password: hashed,
        },
      },
    },
  })

  console.log(`Admin created: ${email}`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
