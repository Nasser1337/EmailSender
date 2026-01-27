import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Updating campaign email addresses...')
  
  const result = await prisma.campaign.updateMany({
    where: {
      OR: [
        { fromEmail: null },
        { fromEmail: '' },
      ],
    },
    data: {
      fromEmail: 'info@medi-dental.be',
      fromName: 'MediDental',
      replyTo: 'info@medi-dental.be',
    },
  })
  
  console.log(`✅ Updated ${result.count} campaigns`)
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
