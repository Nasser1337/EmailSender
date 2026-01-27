'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Trash2, Save } from 'lucide-react'
import { toast } from 'sonner'

interface LanguageRule {
  id: string
  type: string
  value: string
  language: string
  priority: number
}

export default function SettingsPage() {
  const [rules, setRules] = useState<LanguageRule[]>([])
  const [loading, setLoading] = useState(true)
  const [newRule, setNewRule] = useState({ type: 'city', value: '', language: 'nl' })

  useEffect(() => {
    fetchRules()
  }, [])

  const fetchRules = async () => {
    try {
      const response = await fetch('/api/language-rules')
      if (response.ok) {
        const data = await response.json()
        setRules(data.rules || [])
      }
    } catch (error) {
      console.error('Failed to fetch rules:', error)
      toast.error('Failed to load language rules')
    } finally {
      setLoading(false)
    }
  }

  const addRule = async () => {
    if (!newRule.value.trim()) {
      toast.error('Please enter a city or province name')
      return
    }

    try {
      const response = await fetch('/api/language-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRule),
      })

      if (response.ok) {
        toast.success('Language rule added')
        setNewRule({ type: 'city', value: '', language: 'nl' })
        fetchRules()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to add rule')
      }
    } catch (error) {
      console.error('Add rule error:', error)
      toast.error('Failed to add rule')
    }
  }

  const deleteRule = async (id: string) => {
    try {
      const response = await fetch(`/api/language-rules/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Language rule deleted')
        fetchRules()
      } else {
        toast.error('Failed to delete rule')
      }
    } catch (error) {
      console.error('Delete rule error:', error)
      toast.error('Failed to delete rule')
    }
  }

  const cityRules = rules.filter(r => r.type === 'city')
  const provinceRules = rules.filter(r => r.type === 'province')

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Configure language detection rules for your contacts
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Language Rule</CardTitle>
          <CardDescription>
            Define which cities and provinces should use Dutch or French
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <select
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
              value={newRule.type}
              onChange={(e) => setNewRule({ ...newRule, type: e.target.value })}
            >
              <option value="city">City</option>
              <option value="province">Province</option>
            </select>
            <Input
              placeholder="Enter city or province name..."
              value={newRule.value}
              onChange={(e) => setNewRule({ ...newRule, value: e.target.value })}
              className="flex-1"
            />
            <select
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
              value={newRule.language}
              onChange={(e) => setNewRule({ ...newRule, language: e.target.value })}
            >
              <option value="nl">🇳🇱 Dutch</option>
              <option value="fr">🇫🇷 French</option>
            </select>
            <Button onClick={addRule}>
              <Plus className="mr-2 h-4 w-4" />
              Add Rule
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>City Rules ({cityRules.length})</CardTitle>
            <CardDescription>
              Cities that should use specific languages
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : cityRules.length === 0 ? (
              <p className="text-muted-foreground">No city rules defined</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {cityRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{rule.value}</span>
                      <Badge variant={rule.language === 'nl' ? 'default' : 'secondary'}>
                        {rule.language === 'nl' ? '🇳🇱 Dutch' : '🇫🇷 French'}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRule(rule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Province Rules ({provinceRules.length})</CardTitle>
            <CardDescription>
              Provinces that should use specific languages
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : provinceRules.length === 0 ? (
              <p className="text-muted-foreground">No province rules defined</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {provinceRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{rule.value}</span>
                      <Badge variant={rule.language === 'nl' ? 'default' : 'secondary'}>
                        {rule.language === 'nl' ? '🇳🇱 Dutch' : '🇫🇷 French'}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRule(rule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How Language Detection Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>1. When importing contacts, the system checks the city first</p>
          <p>2. If no city rule matches, it checks the province</p>
          <p>3. If no rules match, it defaults to Dutch (nl)</p>
          <p>4. You can manually override the language for any contact</p>
          <p className="pt-2 font-medium text-foreground">
            💡 Tip: Add common Belgian cities and provinces to ensure accurate language detection
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
