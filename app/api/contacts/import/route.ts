import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseExcelFile, parseCSVFile } from '@/lib/excel-parser'
import { detectLanguage } from '@/lib/language-detector'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const mappingStr = formData.get('mapping') as string
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }
    
    const columnMapping = mappingStr ? JSON.parse(mappingStr) : {}
    
    const buffer = Buffer.from(await file.arrayBuffer())
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    
    let parseResult
    if (fileExtension === 'csv') {
      parseResult = await parseCSVFile(buffer, columnMapping)
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      parseResult = await parseExcelFile(buffer, columnMapping)
    } else {
      return NextResponse.json(
        { error: 'Invalid file type. Only .xlsx, .xls, and .csv files are supported' },
        { status: 400 }
      )
    }
    
    // Check existing emails in batches to avoid query limits
    const allEmails = parseResult.data.map(c => c.email.toLowerCase())
    const existingEmailSet = new Set<string>()
    
    const BATCH_SIZE = 500
    for (let i = 0; i < allEmails.length; i += BATCH_SIZE) {
      const batch = allEmails.slice(i, i + BATCH_SIZE)
      const existingBatch = await prisma.contact.findMany({
        where: { email: { in: batch } },
        select: { email: true },
      })
      existingBatch.forEach(c => existingEmailSet.add(c.email.toLowerCase()))
    }
    
    const newContacts = parseResult.data.filter(
      c => !existingEmailSet.has(c.email.toLowerCase())
    )
    
    console.log(`Processing ${newContacts.length} new contacts out of ${parseResult.data.length} total`)
    
    // Process language detection in batches
    const contactsWithLanguage = []
    for (let i = 0; i < newContacts.length; i += BATCH_SIZE) {
      const batch = newContacts.slice(i, i + BATCH_SIZE)
      const batchWithLanguage = await Promise.all(
        batch.map(async (contact) => {
          const language = await detectLanguage(contact.city, contact.province)
          return {
            firstName: contact.first_name,
            lastName: contact.last_name,
            email: contact.email.toLowerCase(),
            company: contact.company,
            city: contact.city,
            postcode: contact.postcode,
            province: contact.province,
            region: contact.region,
            website: contact.website,
            phone: contact.phone,
            language,
            languageOverride: false,
          }
        })
      )
      contactsWithLanguage.push(...batchWithLanguage)
    }
    
    // Insert in batches to avoid transaction limits
    let importedCount = 0
    if (contactsWithLanguage.length > 0) {
      for (let i = 0; i < contactsWithLanguage.length; i += BATCH_SIZE) {
        const batch = contactsWithLanguage.slice(i, i + BATCH_SIZE)
        try {
          await prisma.contact.createMany({
            data: batch,
          })
          importedCount += batch.length
          console.log(`Imported batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} contacts`)
        } catch (error) {
          console.error(`Error importing batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error)
          // Continue with next batch even if one fails
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      imported: importedCount,
      skipped: existingEmailSet.size,
      errors: parseResult.errors,
      stats: parseResult.stats,
      total: parseResult.data.length,
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Failed to import contacts', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
