import { NextResponse } from 'next/server'
import { generateExampleExcel } from '@/lib/excel-parser'

export async function GET() {
  try {
    const buffer = generateExampleExcel()
    
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="contacts-example.xlsx"',
      },
    })
  } catch (error) {
    console.error('Error generating example file:', error)
    return NextResponse.json(
      { error: 'Failed to generate example file' },
      { status: 500 }
    )
  }
}
