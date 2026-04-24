import 'dotenv/config'
import { hashPassword } from 'better-auth/crypto'
import prisma from '../src/lib/prisma.ts'
import { Role } from '@prisma/client'

const users = [
  { name: 'Admin', email: 'admin@example.com', password: 'password123', role: Role.admin },
  { name: 'Agent', email: 'agent@example.com', password: 'password123', role: Role.agent },
]

async function main() {
  for (const user of users) {
    const existing = await prisma.user.findUnique({ where: { email: user.email } })
    if (existing) {
      console.log(`${user.role} ${user.email} already exists, skipping`)
      continue
    }

    const id = crypto.randomUUID()
    const hashed = await hashPassword(user.password)

    await prisma.user.create({
      data: {
        id,
        name: user.name,
        email: user.email,
        emailVerified: true,
        role: user.role,
        accounts: {
          create: {
            id: crypto.randomUUID(),
            accountId: id,
            providerId: 'credential',
            password: hashed,
          },
        },
      },
    })

    console.log(`Created ${user.role}: ${user.email}`)
  }
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
