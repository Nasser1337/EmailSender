'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Send, Eye, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Campaign {
  id: string
  name: string
  status: string
  subjectNl?: string
  subjectFr?: string
  createdAt: string
  sentAt?: string
}

export default function CampaignsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState<string | null>(null)

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns')
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data.campaigns || [])
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error)
      toast.error('Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async (campaignId: string) => {
    setSending(campaignId)
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sendToAll: true }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Campaign queued! ${data.queued} emails will be sent.`)
        router.push(`/campaigns/${campaignId}/status`)
      } else {
        toast.error(data.error || 'Failed to send campaign')
      }
    } catch (error) {
      console.error('Send campaign error:', error)
      toast.error('Failed to send campaign')
    } finally {
      setSending(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary'
      case 'sending': return 'default'
      case 'sent': return 'default'
      default: return 'secondary'
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Campaigns</h2>
        <Link href="/campaigns/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Campaign
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Campaigns</CardTitle>
          <CardDescription>
            Manage and track your email campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-[400px]">
              <p className="text-muted-foreground">Loading campaigns...</p>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[400px] text-center">
              <p className="text-muted-foreground mb-4">
                No campaigns yet. Create your first campaign to get started.
              </p>
              <Link href="/campaigns/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Campaign
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Subjects</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(campaign.status)}>
                        {campaign.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        {campaign.subjectNl && (
                          <div className="flex items-center gap-1">
                            <span>🇳🇱</span>
                            <span className="text-muted-foreground truncate max-w-[200px]">
                              {campaign.subjectNl}
                            </span>
                          </div>
                        )}
                        {campaign.subjectFr && (
                          <div className="flex items-center gap-1">
                            <span>🇫🇷</span>
                            <span className="text-muted-foreground truncate max-w-[200px]">
                              {campaign.subjectFr}
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(campaign.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {campaign.sentAt ? new Date(campaign.sentAt).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/campaigns/${campaign.id}/status`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleSend(campaign.id)}
                          disabled={sending === campaign.id}
                        >
                          {sending === campaign.id ? (
                            'Sending...'
                          ) : (
                            <>
                              <Send className="mr-2 h-4 w-4" />
                              Send
                            </>
                          )}
                        </Button>
                      </div>
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
