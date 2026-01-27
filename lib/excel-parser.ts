import * as XLSX from 'xlsx'
import { z } from 'zod'

const ContactSchema = z.object({
  first_name: z.string().optional().transform(val => val || undefined),
  last_name: z.string().optional().transform(val => val || undefined),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  company: z.string().optional().transform(val => val || undefined),
  city: z.string().optional().transform(val => val || undefined),
  postcode: z.string().optional().transform(val => val || undefined),
  province: z.string().optional().transform(val => val || undefined),
  region: z.string().optional().transform(val => val || undefined),
  website: z.string().optional().transform(val => val || undefined),
  phone: z.string().optional().transform(val => val || undefined),
})

export type ParsedContact = z.infer<typeof ContactSchema>

export interface ParseResult {
  success: boolean
  data: ParsedContact[]
  errors: Array<{
    row: number
    field: string
    message: string
  }>
  duplicates: string[]
  stats: {
    total: number
    valid: number
    invalid: number
    duplicates: number
  }
}

export async function parseExcelFile(buffer: Buffer, columnMapping?: Record<string, string>): Promise<ParseResult> {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  
  const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' })
  
  const validContacts: ParsedContact[] = []
  const errors: ParseResult['errors'] = []
  const seenEmails = new Set<string>()
  const duplicates: string[] = []
  
  rawData.forEach((row: any, index: number) => {
    const rowNumber = index + 2
    
    const normalizedRow: any = {}
    
    if (columnMapping && Object.keys(columnMapping).length > 0) {
      // Apply custom column mapping
      Object.keys(row).forEach(key => {
        const mappedField = columnMapping[key]
        if (mappedField && mappedField !== '') {
          const value = row[key]
          // Convert to string and trim, skip empty values
          if (value !== null && value !== undefined && value !== '') {
            normalizedRow[mappedField] = String(value).trim()
          }
        }
      })
    } else {
      // Auto-normalize column names
      Object.keys(row).forEach(key => {
        const normalizedKey = key.toLowerCase().trim().replace(/\s+/g, '_')
        const value = row[key]
        if (value !== null && value !== undefined && value !== '') {
          normalizedRow[normalizedKey] = String(value).trim()
        }
      })
    }
    
    // Skip rows without email
    if (!normalizedRow.email || normalizedRow.email === '') {
      return
    }
    
    try {
      const contact = ContactSchema.parse(normalizedRow)
      
      if (seenEmails.has(contact.email.toLowerCase())) {
        duplicates.push(contact.email)
        errors.push({
          row: rowNumber,
          field: 'email',
          message: 'Duplicate email in file',
        })
      } else {
        seenEmails.add(contact.email.toLowerCase())
        validContacts.push(contact)
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          errors.push({
            row: rowNumber,
            field: err.path.join('.'),
            message: err.message,
          })
        })
      }
    }
  })
  
  return {
    success: errors.length === 0,
    data: validContacts,
    errors,
    duplicates,
    stats: {
      total: rawData.length,
      valid: validContacts.length,
      invalid: errors.length,
      duplicates: duplicates.length,
    },
  }
}

export async function parseCSVFile(buffer: Buffer, columnMapping?: Record<string, string>): Promise<ParseResult> {
  const csvString = buffer.toString('utf-8')
  const workbook = XLSX.read(csvString, { type: 'string' })
  
  return parseExcelFile(Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })), columnMapping)
}

export function generateExampleExcel(): Buffer {
  const exampleData = [
    {
      first_name: 'Jan',
      last_name: 'Janssens',
      email: 'jan.janssens@dentist.be',
      company: 'Tandartspraktijk Janssens',
      city: 'Lokeren',
      postcode: '9160',
      province: 'Oost-Vlaanderen',
      region: 'Flanders',
      website: 'www.janssens-dentist.be',
      phone: '+32 9 348 12 34',
    },
    {
      first_name: 'Marie',
      last_name: 'Dubois',
      email: 'marie.dubois@dentiste.be',
      company: 'Cabinet Dentaire Dubois',
      city: 'Waterloo',
      postcode: '1410',
      province: 'Brabant Wallon',
      region: 'Wallonia',
      website: 'www.dubois-dentiste.be',
      phone: '+32 2 354 67 89',
    },
    {
      first_name: 'Peter',
      last_name: 'Vermeulen',
      email: 'peter.vermeulen@tandarts.be',
      company: 'Tandartspraktijk Vermeulen',
      city: 'Gent',
      postcode: '9000',
      province: 'Oost-Vlaanderen',
      region: 'Flanders',
      website: 'www.vermeulen-tandarts.be',
      phone: '+32 9 225 34 56',
    },
  ]
  
  const worksheet = XLSX.utils.json_to_sheet(exampleData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Contacts')
  
  return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }))
}
