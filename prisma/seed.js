const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function main() {
  const count = await prisma.user.count()
  if (count > 0) {
    console.log('Users already exist, skipping seed.')
    return
  }

  const passwordHash = await bcrypt.hash('Test1234!', 12)

  await prisma.user.create({
    data: { email: 'admin@minipaypal.dev', passwordHash, role: 'ADMIN' },
  })

  await prisma.user.create({
    data: { email: 'user@minipaypal.dev', passwordHash, role: 'USER' },
  })

  console.log('Seed complete: admin@minipaypal.dev / user@minipaypal.dev (password: Test1234!)')
}

main()
  .catch((e) => { console.error('Seed failed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
