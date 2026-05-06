import 'dotenv/config'
import { hashPassword } from 'better-auth/crypto'
import prisma from '../src/lib/prisma.ts'
import { Role } from '@prisma/client'
import { AUTO_RESOLVER_EMAIL } from '../src/lib/constants.ts'

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: AUTO_RESOLVER_EMAIL } })
  if (existing) {
    console.log('autoResolver already exists, skipping')
    return
  }

  const id = crypto.randomUUID()
  const password = await hashPassword(crypto.randomUUID())

  await prisma.user.create({
    data: {
      id,
      name: 'autoResolver',
      email: AUTO_RESOLVER_EMAIL,
      emailVerified: true,
      role: Role.agent,
      accounts: {
        create: {
          id: crypto.randomUUID(),
          accountId: id,
          providerId: 'credential',
          password,
        },
      },
    },
  })

  console.log('autoResolver created')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
