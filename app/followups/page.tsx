'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { RefreshCw, Mail } from 'lucide-react'
import { toast } from 'sonner'

interface EmailEvent {
  id: string
  contact: {
    id: string
    email: string
    firstName?: string
    lastName?: string
    company?: string
  }
  campaign: {
    id: string
    name: string
  }
  status: string
  sentAt?: string
  openedAt?: string
  clickedAt?: string
  openCount: number
  clickCount: number
}

export default function FollowUpsPage() {
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<EmailEvent[]>([])
  const [stats, setStats] = useState({
    openedNotClicked: 0,
    notOpened: 0,
    failed: 0,
  })

  useEffect(() => {
    fetchFollowUpData()
  }, [])

  const fetchFollowUpData = async () => {
    try {
      const response = await fetch('/api/followups')
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || [])
        setStats(data.stats || { openedNotClicked: 0, notOpened: 0, failed: 0 })
      }
    } catch (error) {
      console.error('Failed to fetch follow-up data:', error)
      toast.error('Failed to load follow-up data')
    } finally {
      setLoading(false)
    }
  }

  const handleSendFollowUp = async (campaignId: string, contactId: string) => {
    if (!confirm('Send a follow-up email to this contact?')) {
      return
    }

    try {
      const response = await fetch('/api/followups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, contactId }),
      })

      if (response.ok) {
        toast.success('Follow-up email queued successfully')
        fetchFollowUpData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to queue follow-up email')
      }
    } catch (error) {
      console.error('Failed to send follow-up:', error)
      toast.error('Failed to queue follow-up email')
    }
  }

  const openedNotClicked = events.filter(e => e.openedAt && !e.clickedAt)
  const notOpened = events.filter(e => e.sentAt && !e.openedAt && e.status !== 'failed' && e.status !== 'bounced')
  const failed = events.filter(e => e.status === 'failed' || e.status === 'bounced')

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Follow-Ups</h2>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground">
            ⚠️ Note: Email opens may not track accurately due to privacy features in Gmail and other clients
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchFollowUpData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Opened, Not Clicked</CardTitle>
            <CardDescription>
              Contacts who opened but didn't click
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openedNotClicked.length}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {openedNotClicked.length === 0 ? 'No contacts in this category' : 'Ready for follow-up'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Not Opened</CardTitle>
            <CardDescription>
              Contacts who haven't opened yet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notOpened.length}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {notOpened.length === 0 ? 'No contacts in this category' : 'May need follow-up'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Failed/Bounced</CardTitle>
            <CardDescription>
              Contacts with delivery issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{failed.length}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {failed.length === 0 ? 'No contacts in this category' : 'Check email addresses'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Email Events</CardTitle>
          <CardDescription>
            Track engagement for all sent emails
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-[400px]">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[400px] text-center">
              <p className="text-muted-foreground mb-4">
                No emails sent yet. Send a campaign first to see engagement data.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Opens</TableHead>
                  <TableHead>Clicks</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {event.contact.firstName || event.contact.lastName
                            ? `${event.contact.firstName || ''} ${event.contact.lastName || ''}`.trim()
                            : event.contact.company || 'Unknown'}
                        </div>
                        <div className="text-sm text-muted-foreground">{event.contact.email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{event.campaign.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          event.status === 'opened' || event.status === 'clicked'
                            ? 'default'
                            : event.status === 'failed' || event.status === 'bounced'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {event.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {event.sentAt ? new Date(event.sentAt).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {event.openCount > 0 ? (
                          <Badge variant="outline">{event.openCount}x</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {event.clickCount > 0 ? (
                          <Badge variant="outline">{event.clickCount}x</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {event.status !== 'failed' && event.status !== 'bounced' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleSendFollowUp(event.campaign.id, event.contact.id)}
                        >
                          <Mail className="mr-2 h-4 w-4" />
                          Follow Up
                        </Button>
                      )}
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
