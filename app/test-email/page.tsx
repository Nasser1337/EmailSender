'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Send } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function TestEmailPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }

    setSending(true)
    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Test email sent! Check your inbox.')
        setEmail('')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to send test email')
      }
    } catch (error) {
      console.error('Failed to send test email:', error)
      toast.error('Failed to send test email')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Test Email Sending</CardTitle>
          <CardDescription>
            Send a test email with clickable links to verify email delivery and link tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendTest} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <Input
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter your email address to receive a test email
              </p>
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium">Test Email Will Include:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Sample greeting text</li>
                <li>Clickable link to medi-dental.be</li>
                <li>Clickable button to contact page</li>
                <li>Click tracking enabled</li>
              </ul>
            </div>

            <Button
              type="submit"
              disabled={sending}
              className="w-full"
            >
              {sending ? (
                <>Sending...</>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Test Email
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">What to Test:</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <strong>1. Email Delivery:</strong>
            <p className="text-muted-foreground">Check if the email arrives in your inbox (check spam folder too)</p>
          </div>
          <div>
            <strong>2. Link Redirect:</strong>
            <p className="text-muted-foreground">Click the links - they should redirect to medi-dental.be</p>
          </div>
          <div>
            <strong>3. Click Tracking:</strong>
            <p className="text-muted-foreground">After clicking, check if the click was tracked in the database</p>
          </div>
          <div>
            <strong>4. Email Formatting:</strong>
            <p className="text-muted-foreground">Verify the email looks professional and links are clickable</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
