import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const rules = await prisma.languageRule.findMany({
      orderBy: [
        { priority: 'desc' },
        { type: 'asc' },
        { value: 'asc' },
      ],
    })
    
    return NextResponse.json({ rules })
  } catch (error) {
    console.error('Error fetching language rules:', error)
    return NextResponse.json(
      { error: 'Failed to fetch language rules' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const rule = await prisma.languageRule.create({
      data: {
        type: body.type,
        value: body.value.toLowerCase().trim(),
        language: body.language,
        priority: body.type === 'city' ? 10 : 5,
      },
    })
    
    return NextResponse.json(rule, { status: 201 })
  } catch (error: any) {
    console.error('Error creating language rule:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'This rule already exists' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create language rule' },
      { status: 500 }
    )
  }
}
