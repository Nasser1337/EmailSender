import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'

const resend = new Resend(process.env.RESEND_API_KEY)

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      )
    }

    // Create a test contact and campaign for tracking
    const testContact = await prisma.contact.upsert({
      where: { email },
      update: {
        firstName: 'Test',
        lastName: 'User',
      },
      create: {
        email,
        firstName: 'Test',
        lastName: 'User',
        language: 'nl',
      },
    })

    // Find or create test campaign
    let testCampaign = await prisma.campaign.findFirst({
      where: { name: 'Test Email Campaign' },
    })

    if (!testCampaign) {
      // Get the first user or create a system user
      let user = await prisma.user.findFirst()
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: 'system@test.com',
            name: 'System',
          },
        })
      }

      testCampaign = await prisma.campaign.create({
        data: {
          name: 'Test Email Campaign',
          subjectNl: 'Test Email - Click Tracking',
          bodyNl: 'This is a test email',
          fromEmail: process.env.NEXT_PUBLIC_FROM_EMAIL || 'noreply@example.com',
          fromName: 'MediDental Test',
          userId: user.id,
        },
      })
    }

    // Create email event for tracking
    const emailEvent = await prisma.emailEvent.create({
      data: {
        contactId: testContact.id,
        campaignId: testCampaign.id,
        subject: 'Test Email - Click Tracking Verification',
        body: 'Test email body',
        language: 'nl',
        status: 'queued',
        isFollowUp: false,
      },
    })

    // Build the tracking URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://email-sender.vercel.app'
    const trackingUrl = `${baseUrl}/api/track/click/${emailEvent.id}?url=${encodeURIComponent('https://www.medi-dental.be')}`
    const contactTrackingUrl = `${baseUrl}/api/track/click/${emailEvent.id}?url=${encodeURIComponent('https://www.medi-dental.be/contact')}`

    // HTML email with clickable links and button
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
    <h2 style="color: #0066cc; margin-top: 0;">Test Email - Click Tracking</h2>
    
    <p>Hello Test User,</p>
    
    <p>This is a test email to verify that email sending and click tracking are working correctly.</p>
    
    <div style="margin: 30px 0;">
      <p><strong>Test Link 1 (Text Link):</strong></p>
      <p>Visit our website: <a href="${trackingUrl}" style="color: #0066cc; text-decoration: underline;">www.medi-dental.be</a></p>
    </div>
    
    <div style="margin: 30px 0;">
      <p><strong>Test Link 2 (Button):</strong></p>
      <a href="${contactTrackingUrl}" style="display: inline-block; background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
        Contact Us
      </a>
    </div>
    
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
      <p style="font-size: 14px; color: #666;">
        <strong>What to verify:</strong><br>
        ✓ Email arrives in your inbox<br>
        ✓ Both links redirect to medi-dental.be<br>
        ✓ Clicks are tracked in the system<br>
        ✓ No 404 errors when clicking
      </p>
    </div>
    
    <div style="margin-top: 20px; font-size: 12px; color: #999;">
      <p>This is an automated test email from the MediDental Email Outreach System.</p>
      <p>Event ID: ${emailEvent.id}</p>
    </div>
  </div>
</body>
</html>
    `

    // Send the email via Resend
    const result = await resend.emails.send({
      from: `${testCampaign.fromName} <${testCampaign.fromEmail}>`,
      to: email,
      subject: 'Test Email - Click Tracking Verification',
      html: htmlBody,
    })

    // Update email event status
    await prisma.emailEvent.update({
      where: { id: emailEvent.id },
      data: {
        status: 'sent',
        sentAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      eventId: emailEvent.id,
      resendId: result.data?.id || 'unknown',
    })
  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to send test email', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
