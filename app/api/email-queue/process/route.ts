import { NextRequest, NextResponse } from 'next/server'
import { sendQueuedEmails } from '@/lib/email-queue'

export async function POST(request: NextRequest) {
  try {
    const { batchSize = 50 } = await request.json().catch(() => ({}))
    
    const results = await sendQueuedEmails(batchSize)
    
    return NextResponse.json({
      success: true,
      ...results,
    })
  } catch (error) {
    console.error('Error processing email queue:', error)
    return NextResponse.json(
      { error: 'Failed to process email queue', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const results = await sendQueuedEmails(50)
    
    return NextResponse.json({
      success: true,
      ...results,
    })
  } catch (error) {
    console.error('Error processing email queue:', error)
    return NextResponse.json(
      { error: 'Failed to process email queue', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
