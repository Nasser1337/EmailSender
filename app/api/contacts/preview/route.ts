import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }
    
    const buffer = Buffer.from(await file.arrayBuffer())
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    
    let workbook: XLSX.WorkBook
    
    if (fileExtension === 'csv') {
      const csvString = buffer.toString('utf-8')
      workbook = XLSX.read(csvString, { type: 'string' })
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      workbook = XLSX.read(buffer, { type: 'buffer' })
    } else {
      return NextResponse.json(
        { error: 'Invalid file type. Only .xlsx, .xls, and .csv files are supported' },
        { status: 400 }
      )
    }
    
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][]
    
    if (rawData.length === 0) {
      return NextResponse.json(
        { error: 'File is empty' },
        { status: 400 }
      )
    }
    
    const headers = rawData[0].map((h: any) => String(h).trim())
    const rows = rawData.slice(1).filter(row => row.some(cell => cell !== ''))
    
    return NextResponse.json({
      headers,
      rows: rows.slice(0, 100), // Limit preview to 100 rows
      totalRows: rows.length,
    })
  } catch (error) {
    console.error('Preview error:', error)
    return NextResponse.json(
      { error: 'Failed to preview file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
