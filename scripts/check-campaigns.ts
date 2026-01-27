import { prisma } from '../lib/prisma'

async function main() {
  console.log('📋 Checking campaigns...\n')
  
  const campaigns = await prisma.campaign.findMany({
    select: {
      id: true,
      name: true,
      fromEmail: true,
      fromName: true,
      replyTo: true,
      status: true,
    },
  })
  
  if (campaigns.length === 0) {
    console.log('No campaigns found')
    return
  }
  
  campaigns.forEach((campaign) => {
    console.log(`Campaign: ${campaign.name}`)
    console.log(`  ID: ${campaign.id}`)
    console.log(`  From Email: ${campaign.fromEmail || '(not set)'}`)
    console.log(`  From Name: ${campaign.fromName || '(not set)'}`)
    console.log(`  Reply To: ${campaign.replyTo || '(not set)'}`)
    console.log(`  Status: ${campaign.status}`)
    console.log('')
  })
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
