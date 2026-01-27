import { NextRequest, NextResponse } from 'next/server'
import { parseExcelFile, parseCSVFile } from '@/lib/excel-parser'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const mappingStr = formData.get('mapping') as string
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
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
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }
    
    // Return detailed parse results for debugging
    return NextResponse.json({
      success: true,
      columnMapping,
      parseResult: {
        ...parseResult,
        sampleData: parseResult.data.slice(0, 5),
        sampleErrors: parseResult.errors.slice(0, 20),
      },
    })
  } catch (error) {
    console.error('Test import error:', error)
    return NextResponse.json(
      { error: 'Failed to test import', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
