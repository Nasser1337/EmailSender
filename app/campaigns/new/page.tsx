'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save } from 'lucide-react'
import { toast } from 'sonner'

export default function NewCampaignPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    subjectNl: '',
    subjectFr: '',
    bodyNl: '',
    bodyFr: '',
    followUpSubjectNl: '',
    followUpSubjectFr: '',
    followUpBodyNl: '',
    followUpBodyFr: '',
    fromEmail: process.env.NEXT_PUBLIC_FROM_EMAIL || '',
    fromName: process.env.NEXT_PUBLIC_FROM_NAME || '',
    replyTo: process.env.NEXT_PUBLIC_FROM_EMAIL || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name) {
      toast.error('Campaign name is required')
      return
    }

    if (!formData.subjectNl && !formData.subjectFr) {
      toast.error('At least one subject line is required')
      return
    }

    if (!formData.bodyNl && !formData.bodyFr) {
      toast.error('At least one email body is required')
      return
    }

    setSaving(true)

    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userId: 'admin-user-id', // TODO: Replace with actual user ID from auth
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Campaign created successfully!')
        router.push('/campaigns')
      } else {
        toast.error(data.error || 'Failed to create campaign')
      }
    } catch (error) {
      console.error('Create campaign error:', error)
      toast.error('Failed to create campaign')
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Create Campaign</h2>
          <p className="text-muted-foreground">
            Create a new email outreach campaign with Dutch and French templates
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
            <CardDescription>
              Basic information about your campaign
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Campaign Name *</label>
              <Input
                placeholder="e.g., Dentist Outreach Q1 2024"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">From Email *</label>
                <Input
                  type="email"
                  placeholder="info@medi-dental.be"
                  value={formData.fromEmail}
                  onChange={(e) => updateField('fromEmail', e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Must be a verified domain in Resend
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">From Name</label>
                <Input
                  placeholder="Your Company"
                  value={formData.fromName}
                  onChange={(e) => updateField('fromName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Reply To</label>
                <Input
                  type="email"
                  placeholder="reply@yourdomain.com"
                  value={formData.replyTo}
                  onChange={(e) => updateField('replyTo', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Dutch Template</CardTitle>
                <CardDescription>
                  Email template for Dutch-speaking contacts
                </CardDescription>
              </div>
              <Badge>🇳🇱 Nederlands</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject Line</label>
              <Input
                placeholder="Hallo {{first_name}}, een bericht voor {{company}}"
                value={formData.subjectNl}
                onChange={(e) => updateField('subjectNl', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Available variables: {'{'}{'{'} first_name {'}'}{'}'}, {'{'}{'{'} last_name {'}'}{'}'}, {'{'}{'{'} company {'}'}{'}'}, {'{'}{'{'} city {'}'}{'}'}, {'{'}{'{'} province {'}'}{'}'}, {'{'}{'{'} email {'}'}{'}'}, {'{'}{'{'} phone {'}'}{'}'}, {'{'}{'{'} website {'}'}{'}'}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email Body</label>
              <textarea
                className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Beste {{first_name}},&#10;&#10;We willen graag contact met u opnemen over {{company}} in {{city}}.&#10;&#10;Met vriendelijke groet,&#10;Het Team"
                value={formData.bodyNl}
                onChange={(e) => updateField('bodyNl', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>French Template</CardTitle>
                <CardDescription>
                  Email template for French-speaking contacts
                </CardDescription>
              </div>
              <Badge variant="secondary">🇫🇷 Français</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject Line</label>
              <Input
                placeholder="Bonjour {{first_name}}, un message pour {{company}}"
                value={formData.subjectFr}
                onChange={(e) => updateField('subjectFr', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Available variables: {'{'}{'{'} first_name {'}'}{'}'}, {'{'}{'{'} last_name {'}'}{'}'}, {'{'}{'{'} company {'}'}{'}'}, {'{'}{'{'} city {'}'}{'}'}, {'{'}{'{'} province {'}'}{'}'}, {'{'}{'{'} email {'}'}{'}'}, {'{'}{'{'} phone {'}'}{'}'}, {'{'}{'{'} website {'}'}{'}'}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email Body</label>
              <textarea
                className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Cher {{first_name}},&#10;&#10;Nous aimerions vous contacter concernant {{company}} à {{city}}.&#10;&#10;Cordialement,&#10;L'équipe"
                value={formData.bodyFr}
                onChange={(e) => updateField('bodyFr', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Dutch Follow-Up Template</CardTitle>
                <CardDescription>
                  Follow-up email for contacts who didn't respond (Dutch)
                </CardDescription>
              </div>
              <Badge>🇳🇱 Nederlands</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Follow-Up Subject Line</label>
              <Input
                placeholder="Re: Ons vorige bericht voor {{company}}"
                value={formData.followUpSubjectNl}
                onChange={(e) => updateField('followUpSubjectNl', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Follow-Up Email Body</label>
              <textarea
                className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Beste {{first_name}},&#10;&#10;We hebben u onlangs een e-mail gestuurd maar hebben nog geen reactie ontvangen.&#10;&#10;Wij willen graag met u in contact komen over {{company}}.&#10;&#10;Laat het ons weten als u geïnteresseerd bent.&#10;&#10;Met vriendelijke groet,&#10;Het Team"
                value={formData.followUpBodyNl}
                onChange={(e) => updateField('followUpBodyNl', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>French Follow-Up Template</CardTitle>
                <CardDescription>
                  Follow-up email for contacts who didn't respond (French)
                </CardDescription>
              </div>
              <Badge variant="secondary">🇫🇷 Français</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Follow-Up Subject Line</label>
              <Input
                placeholder="Re: Notre message précédent pour {{company}}"
                value={formData.followUpSubjectFr}
                onChange={(e) => updateField('followUpSubjectFr', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Follow-Up Email Body</label>
              <textarea
                className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Cher {{first_name}},&#10;&#10;Nous vous avons récemment envoyé un e-mail mais n'avons pas encore reçu de réponse.&#10;&#10;Nous aimerions vous contacter concernant {{company}}.&#10;&#10;Faites-nous savoir si vous êtes intéressé.&#10;&#10;Cordialement,&#10;L'équipe"
                value={formData.followUpBodyFr}
                onChange={(e) => updateField('followUpBodyFr', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Creating...' : 'Create Campaign'}
          </Button>
        </div>
      </form>
    </div>
  )
}
