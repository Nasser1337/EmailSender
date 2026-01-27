'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, RefreshCw, Send } from 'lucide-react'
import { toast } from 'sonner'

interface EmailEvent {
  id: string
  contact: {
    email: string
    firstName?: string
    lastName?: string
    company?: string
  }
  subject: string
  language: string
  status: string
  sentAt?: string
  deliveredAt?: string
  openedAt?: string
  clickedAt?: string
  failedAt?: string
  errorMessage?: string
}

interface Campaign {
  id: string
  name: string
  status: string
}

export default function CampaignStatusPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [events, setEvents] = useState<EmailEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    failed: 0,
  })

  useEffect(() => {
    fetchCampaignStatus()
    processQueue() // Process queue on page load
    const interval = setInterval(() => {
      fetchCampaignStatus()
      processQueue() // Also process queue periodically
    }, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [params.id])

  const processQueue = async () => {
    try {
      await fetch('/api/email-queue/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchSize: 50 }),
      })
    } catch (error) {
      console.error('Failed to process queue:', error)
    }
  }

  const handleProcessQueue = async () => {
    setProcessing(true)
    try {
      const response = await fetch('/api/email-queue/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchSize: 50 }),
      })
      
      if (response.ok) {
        const data = await response.json()
        toast.success(`Processed ${data.sent} emails`)
        fetchCampaignStatus()
      }
    } catch (error) {
      console.error('Failed to process queue:', error)
      toast.error('Failed to process email queue')
    } finally {
      setProcessing(false)
    }
  }

  const fetchCampaignStatus = async () => {
    try {
      const [campaignRes, eventsRes] = await Promise.all([
        fetch(`/api/campaigns/${params.id}`),
        fetch(`/api/campaigns/${params.id}/events`),
      ])

      if (campaignRes.ok) {
        const campaignData = await campaignRes.json()
        setCampaign(campaignData)
      }

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json()
        setEvents(eventsData.events || [])
        
        // Calculate stats
        const total = eventsData.events.length
        const sent = eventsData.events.filter((e: EmailEvent) => e.sentAt).length
        const delivered = eventsData.events.filter((e: EmailEvent) => e.deliveredAt).length
        const opened = eventsData.events.filter((e: EmailEvent) => e.openedAt).length
        const clicked = eventsData.events.filter((e: EmailEvent) => e.clickedAt).length
        const failed = eventsData.events.filter((e: EmailEvent) => e.failedAt).length
        
        setStats({ total, sent, delivered, opened, clicked, failed })
      }
    } catch (error) {
      console.error('Failed to fetch campaign status:', error)
      toast.error('Failed to load campaign status')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued': return 'secondary'
      case 'sent': return 'default'
      case 'delivered': return 'default'
      case 'opened': return 'default'
      case 'clicked': return 'default'
      case 'failed': return 'destructive'
      case 'bounced': return 'destructive'
      default: return 'secondary'
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight">{campaign?.name || 'Campaign'}</h2>
          <p className="text-muted-foreground">Email send status and tracking</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleProcessQueue} disabled={processing}>
            <Send className="mr-2 h-4 w-4" />
            {processing ? 'Processing...' : 'Process Queue'}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchCampaignStatus}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sent}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.delivered}</div>
            <p className="text-xs text-muted-foreground">
              {stats.sent > 0 ? Math.round((stats.delivered / stats.sent) * 100) : 0}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Opened</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.opened}</div>
            <p className="text-xs text-muted-foreground">
              {stats.delivered > 0 ? Math.round((stats.opened / stats.delivered) * 100) : 0}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Clicked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clicked}</div>
            <p className="text-xs text-muted-foreground">
              {stats.opened > 0 ? Math.round((stats.clicked / stats.opened) * 100) : 0}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.failed}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.failed / stats.total) * 100) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email Status</CardTitle>
          <CardDescription>
            Track the delivery status of each email
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-[400px]">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="flex items-center justify-center h-[400px]">
              <p className="text-muted-foreground">No emails sent yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Delivered</TableHead>
                  <TableHead>Opened</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">
                      {event.contact.firstName || event.contact.lastName
                        ? `${event.contact.firstName || ''} ${event.contact.lastName || ''}`.trim()
                        : event.contact.company || '-'}
                    </TableCell>
                    <TableCell>{event.contact.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {event.language === 'nl' ? '🇳🇱 NL' : '🇫🇷 FR'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(event.status)}>
                        {event.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {event.sentAt ? new Date(event.sentAt).toLocaleTimeString() : '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {event.deliveredAt ? new Date(event.deliveredAt).toLocaleTimeString() : '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {event.openedAt ? new Date(event.openedAt).toLocaleTimeString() : '-'}
                    </TableCell>
                    <TableCell className="text-destructive text-sm">
                      {event.errorMessage ? (
                        <span className="truncate max-w-[200px] block" title={event.errorMessage}>
                          {event.errorMessage}
                        </span>
                      ) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
