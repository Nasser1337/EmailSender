import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearContacts() {
  console.log('🗑️  Deleting all contacts...')
  
  const result = await prisma.contact.deleteMany({})
  
  console.log(`✅ Deleted ${result.count} contacts`)
  
  await prisma.$disconnect()
}

clearContacts()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
