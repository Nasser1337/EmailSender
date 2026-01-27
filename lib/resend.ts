import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not defined in environment variables')
}

export const resend = new Resend(process.env.RESEND_API_KEY)

export function addTrackingPixel(html: string, trackingUrl: string): string {
  const pixel = `<img src="${trackingUrl}" width="1" height="1" style="display:none;" alt="" />`
  
  if (html.includes('</body>')) {
    return html.replace('</body>', `${pixel}</body>`)
  }
  
  return html + pixel
}

export function wrapLinksWithTracking(html: string, baseTrackingUrl: string): string {
  const linkRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"([^>]*)>/gi
  
  return html.replace(linkRegex, (match, url, otherAttrs) => {
    if (url.startsWith('mailto:') || url.startsWith('#') || url.startsWith('tel:')) {
      return match
    }
    
    const encodedUrl = encodeURIComponent(url)
    const trackedUrl = `${baseTrackingUrl}?url=${encodedUrl}`
    
    return `<a href="${trackedUrl}"${otherAttrs}>`
  })
}

export function replaceVariables(
  template: string,
  variables: Record<string, string | null | undefined>
): string {
  let result = template
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
    result = result.replace(regex, value || '')
  })
  
  return result
}

export type ResendWebhookEvent = {
  type: 'email.sent' | 'email.delivered' | 'email.delivery_delayed' | 
        'email.complained' | 'email.bounced' | 'email.opened' | 'email.clicked'
  created_at: string
  data: {
    email_id: string
    from: string
    to: string[]
    subject: string
    created_at: string
    click?: {
      link: string
      timestamp: string
    }
  }
}

export function mapResendStatusToInternal(eventType: string): string {
  const statusMap: Record<string, string> = {
    'email.sent': 'sent',
    'email.delivered': 'delivered',
    'email.delivery_delayed': 'queued',
    'email.complained': 'complained',
    'email.bounced': 'bounced',
    'email.opened': 'opened',
    'email.clicked': 'clicked',
  }
  
  return statusMap[eventType] || 'queued'
}
