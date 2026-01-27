import { NextResponse } from 'next/server'
import { getQueueStats } from '@/lib/email-queue'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const stats = await getQueueStats()
    
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching queue stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch queue stats' },
      { status: 500 }
    )
  }
}
