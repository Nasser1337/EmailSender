import { prisma } from './prisma'

const FRENCH_CITIES = [
  'waterloo', 'brussels', 'bruxelles', 'liège', 'liege', 'namur', 'namen',
  'charleroi', 'mons', 'bergen', 'tournai', 'doornik', 'mouscron', 'moeskroen',
  'arlon', 'aarlen', 'bastogne', 'dinant', 'huy', 'hoei', 'verviers',
  'wavre', 'waver', 'ottignies', 'louvain-la-neuve', 'nivelles', 'nijvel',
  'braine-l\'alleud', 'eigenbrakel', 'la louvière', 'soignies', 'zinnik',
  'gembloux', 'jemeppe', 'seraing', 'herstal', 'chaudfontaine', 'spa',
  'eupen', 'malmedy', 'stavelot', 'durbuy', 'rochefort', 'ciney',
  'philippeville', 'couvin', 'virton', 'florenville', 'bouillon', 'marche-en-famenne',
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
  'ieper', 'ypres', 'poperinge', 'veurne', 'furnes', 'diksmuide', 'dixmude',
  'waregem', 'harelbeke', 'menen', 'menin', 'tielt', 'izegem', 'wervik',
  'dendermonde', 'termonde', 'ninove', 'geraardsbergen', 'grammont',
  'oudenaarde', 'audenarde', 'ronse', 'renaix', 'zottegem', 'wetteren',
  'beveren', 'temse', 'hamme', 'zelzate', 'eeklo', 'deinze',
  'tongeren', 'tongres', 'bilzen', 'beringen', 'lommel', 'mol', 'geel',
  'herentals', 'lier', 'hoogstraten', 'westerlo', 'aarschot', 'diest',
  'tienen', 'tirlemont', 'halle', 'vilvoorde', 'vilvorde',
  'zaventem', 'grimbergen', 'dilbeek', 'asse', 'ternat', 'lennik'
]

const DUTCH_PROVINCES = [
  'flanders', 'vlaanderen', 'flemish', 'vlaams',
  'antwerp', 'antwerpen',
  'east flanders', 'oost-vlaanderen', 'east-flanders',
  'west flanders', 'west-vlaanderen', 'west-flanders',
  'limburg',
  'flemish brabant', 'vlaams-brabant', 'vlaams brabant'
]

function normalizeString(str: string | null | undefined): string {
  if (!str) return ''
  return str.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export async function detectLanguage(
  city: string | null | undefined,
  province: string | null | undefined
): Promise<'nl' | 'fr'> {
  const normalizedCity = normalizeString(city)
  const normalizedProvince = normalizeString(province)

  const rules = await prisma.languageRule.findMany({
    orderBy: { priority: 'desc' }
  })

  for (const rule of rules) {
    const normalizedValue = normalizeString(rule.value)
    
    if (rule.type === 'city' && normalizedCity === normalizedValue) {
      return rule.language as 'nl' | 'fr'
    }
    
    if (rule.type === 'province' && normalizedProvince.includes(normalizedValue)) {
      return rule.language as 'nl' | 'fr'
    }
  }

  if (normalizedCity && FRENCH_CITIES.includes(normalizedCity)) {
    return 'fr'
  }

  if (normalizedProvince) {
    for (const frProvince of FRENCH_PROVINCES) {
      if (normalizedProvince.includes(frProvince)) {
        return 'fr'
      }
    }
  }

  if (normalizedCity && DUTCH_CITIES.includes(normalizedCity)) {
    return 'nl'
  }

  if (normalizedProvince) {
    for (const nlProvince of DUTCH_PROVINCES) {
      if (normalizedProvince.includes(nlProvince)) {
        return 'nl'
      }
    }
  }

  return 'nl'
}

export async function seedLanguageRules() {
  const rules = [
    ...FRENCH_CITIES.map(city => ({ type: 'city', value: city, language: 'fr', priority: 10 })),
    ...FRENCH_PROVINCES.map(province => ({ type: 'province', value: province, language: 'fr', priority: 5 })),
    ...DUTCH_CITIES.map(city => ({ type: 'city', value: city, language: 'nl', priority: 10 })),
    ...DUTCH_PROVINCES.map(province => ({ type: 'province', value: province, language: 'nl', priority: 5 })),
  ]

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
  }

  console.log('Language rules seeded successfully')
}
