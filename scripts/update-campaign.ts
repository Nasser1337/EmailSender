import { prisma } from '../lib/prisma'

async function main() {
  console.log('🔧 Updating campaign "scaft" with verified email...')
  
  const result = await prisma.campaign.update({
    where: { id: 'cmkvfoehl01bztzn8e8eiyi88' },
    data: {
      fromEmail: 'info@medi-dental.be',
      fromName: 'MediDental',
      replyTo: 'info@medi-dental.be',
    },
  })
  
  console.log('✅ Updated campaign:')
  console.log(`  Name: ${result.name}`)
  console.log(`  From Email: ${result.fromEmail}`)
  console.log(`  From Name: ${result.fromName}`)
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
