import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const FRENCH_CITIES = [
  'waterloo', 'brussels', 'bruxelles', 'liège', 'liege', 'namur', 'namen',
  'charleroi', 'mons', 'bergen', 'tournai', 'doornik', 'mouscron', 'moeskroen',
  'arlon', 'aarlen', 'bastogne', 'dinant', 'huy', 'hoei', 'verviers',
  'wavre', 'waver', 'ottignies', 'louvain-la-neuve', 'nivelles', 'nijvel',
]

const FRENCH_PROVINCES = [
  'wallonia', 'wallonie', 'wallon', 'wallonne',
  'hainaut', 'henegouwen',
  'liège', 'liege', 'luik',
  'namur', 'namen',
  'luxembourg', 'luxemburg',
  'brabant wallon', 'waals-brabant', 'walloon brabant'
]

const DUTCH_CITIES = [
  'lokeren', 'ghent', 'gent', 'antwerp', 'antwerpen', 'bruges', 'brugge',
  'leuven', 'louvain', 'mechelen', 'malines', 'aalst', 'alost', 'sint-niklaas',
  'hasselt', 'genk', 'turnhout', 'roeselare', 'kortrijk', 'courtrai',
  'oostende', 'ostend', 'knokke-heist', 'blankenberge', 'de panne',
]

const DUTCH_PROVINCES = [
  'flanders', 'vlaanderen', 'flemish', 'vlaams',
  'antwerp', 'antwerpen',
  'east flanders', 'oost-vlaanderen', 'east-flanders',
  'west flanders', 'west-vlaanderen', 'west-flanders',
  'limburg',
  'flemish brabant', 'vlaams-brabant', 'vlaams brabant'
]

async function main() {
  console.log('🌱 Seeding database...')

  console.log('📍 Creating language rules...')
  
  const rules = [
    ...FRENCH_CITIES.map(city => ({ type: 'city', value: city, language: 'fr', priority: 10 })),
    ...FRENCH_PROVINCES.map(province => ({ type: 'province', value: province, language: 'fr', priority: 5 })),
    ...DUTCH_CITIES.map(city => ({ type: 'city', value: city, language: 'nl', priority: 10 })),
    ...DUTCH_PROVINCES.map(province => ({ type: 'province', value: province, language: 'nl', priority: 5 })),
  ]

  let created = 0
  for (const rule of rules) {
    await prisma.languageRule.upsert({
      where: {
        type_value: {
          type: rule.type,
          value: rule.value,
        },
      },
      update: {},
      create: rule,
    })
    created++
  }

  console.log(`✅ Created ${created} language rules`)

  console.log('👤 Creating default user...')
  const user = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
    },
  })
  console.log(`✅ Created user: ${user.email}`)

  console.log('📧 Creating example campaign...')
  const campaign = await prisma.campaign.upsert({
    where: { id: 'example-campaign' },
    update: {},
    create: {
      id: 'example-campaign',
      name: 'Example Campaign',
      status: 'draft',
      subjectNl: 'Hallo {{first_name}}, een bericht voor {{company}}',
      subjectFr: 'Bonjour {{first_name}}, un message pour {{company}}',
      bodyNl: `
        <html>
          <body>
            <h2>Beste {{first_name}},</h2>
            <p>We willen graag contact met u opnemen over {{company}} in {{city}}.</p>
            <p>Met vriendelijke groet,<br>Het Team</p>
          </body>
        </html>
      `,
      bodyFr: `
        <html>
          <body>
            <h2>Cher {{first_name}},</h2>
            <p>Nous aimerions vous contacter concernant {{company}} à {{city}}.</p>
            <p>Cordialement,<br>L'équipe</p>
          </body>
        </html>
      `,
      fromEmail: 'outreach@example.com',
      fromName: 'Outreach Team',
      userId: user.id,
    },
  })
  console.log(`✅ Created campaign: ${campaign.name}`)

  console.log('👥 Creating example contacts...')
  const contacts = [
    {
      firstName: 'Jan',
      lastName: 'Janssens',
      email: 'jan.janssens@example.be',
      company: 'Tandartspraktijk Janssens',
      city: 'Lokeren',
      postcode: '9160',
      province: 'Oost-Vlaanderen',
      region: 'Flanders',
      language: 'nl',
    },
    {
      firstName: 'Marie',
      lastName: 'Dubois',
      email: 'marie.dubois@example.be',
      company: 'Cabinet Dentaire Dubois',
      city: 'Waterloo',
      postcode: '1410',
      province: 'Brabant Wallon',
      region: 'Wallonia',
      language: 'fr',
    },
    {
      firstName: 'Peter',
      lastName: 'Vermeulen',
      email: 'peter.vermeulen@example.be',
      company: 'Tandartspraktijk Vermeulen',
      city: 'Gent',
      postcode: '9000',
      province: 'Oost-Vlaanderen',
      region: 'Flanders',
      language: 'nl',
    },
  ]

  for (const contact of contacts) {
    await prisma.contact.upsert({
      where: { email: contact.email },
      update: {},
      create: contact,
    })
  }
  console.log(`✅ Created ${contacts.length} example contacts`)

  console.log('✨ Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
