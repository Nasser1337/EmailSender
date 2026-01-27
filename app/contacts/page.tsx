'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Upload, Download, Search, Trash2, Plus, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

interface Contact {
  id: string
  firstName?: string
  lastName?: string
  email: string
  company?: string
  city?: string
  province?: string
  language: string
  createdAt: string
}

interface ColumnMapping {
  [key: string]: string // Excel column -> our field
}

interface PreviewData {
  headers: string[]
  rows: any[][]
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalContacts, setTotalContacts] = useState(0)
  const [languageFilter, setLanguageFilter] = useState('')
  const [pageSize, setPageSize] = useState(100)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({})
  const [showMapping, setShowMapping] = useState(false)
  const [addContactDialogOpen, setAddContactDialogOpen] = useState(false)
  const [newContact, setNewContact] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    city: '',
    province: '',
    postcode: '',
    phone: '',
    website: '',
    language: 'nl',
  })

  useEffect(() => {
    fetchContacts()
  }, [currentPage, pageSize, languageFilter])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (currentPage === 1) {
        fetchContacts()
      } else {
        setCurrentPage(1)
      }
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm])

  const fetchContacts = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(languageFilter && { language: languageFilter }),
      })
      const response = await fetch(`/api/contacts?${params}`)
      if (response.ok) {
        const data = await response.json()
        setContacts(data.contacts || [])
        setTotalPages(data.pagination?.pages || 1)
        setTotalContacts(data.pagination?.total || 0)
      }
    } catch (error) {
      console.error('Failed to fetch contacts:', error)
      toast.error('Failed to load contacts')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!['xlsx', 'xls', 'csv'].includes(extension || '')) {
      toast.error('Please select a valid Excel (.xlsx, .xls) or CSV file')
      return
    }

    setSelectedFile(file)
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/contacts/preview', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setPreviewData(data)
        
        // Auto-map columns if they match our field names
        const autoMapping: ColumnMapping = {}
        const fieldNames = ['email', 'first_name', 'last_name', 'company', 'city', 'province', 'postcode', 'region', 'website', 'phone']
        
        data.headers.forEach((header: string) => {
          const normalized = header.toLowerCase().trim().replace(/\s+/g, '_')
          if (fieldNames.includes(normalized)) {
            autoMapping[header] = normalized
          }
        })
        
        setColumnMapping(autoMapping)
        setShowMapping(true)
      } else {
        toast.error(data.error || 'Failed to preview file')
      }
    } catch (error) {
      console.error('Preview error:', error)
      toast.error('Failed to preview file')
    } finally {
      setUploading(false)
    }
  }

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first')
      return
    }

    if (!columnMapping['email']) {
      toast.error('Please map the email column')
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('mapping', JSON.stringify(columnMapping))

    const rowCount = previewData?.rows.length || 0
    const loadingToast = toast.loading(`Importing ${rowCount} contacts... This may take a minute for large files.`)

    try {
      const response = await fetch('/api/contacts/import', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      toast.dismiss(loadingToast)

      if (response.ok) {
        if (data.imported > 0) {
          toast.success(`Successfully imported ${data.imported} contacts!`)
        }
        if (data.skipped > 0) {
          toast.info(`Skipped ${data.skipped} duplicate contacts`)
        }
        if (data.errors && data.errors.length > 0) {
          toast.error(`${data.errors.length} rows had errors. Check console for details.`)
          console.log('Import errors:', data.errors.slice(0, 20)) // Show first 20 errors
        }
        if (data.imported === 0 && data.errors.length > 0) {
          toast.error('No contacts imported. Please check your column mapping and data format.')
        }
        setImportDialogOpen(false)
        setSelectedFile(null)
        setPreviewData(null)
        setShowMapping(false)
        setColumnMapping({})
        fetchContacts()
      } else {
        toast.error(data.error || 'Failed to import contacts')
        if (data.details) {
          console.error('Import error details:', data.details)
        }
      }
    } catch (error) {
      toast.dismiss(loadingToast)
      console.error('Import error:', error)
      toast.error('Failed to import contacts. Check console for details.')
    } finally {
      setUploading(false)
    }
  }

  const downloadExample = () => {
    const link = document.createElement('a')
    link.href = '/api/contacts/example'
    link.download = 'contacts-example.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Example file downloaded')
  }

  const handleAddContact = async () => {
    if (!newContact.email) {
      toast.error('Email is required')
      return
    }

    setUploading(true)
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContact),
      })

      if (response.ok) {
        toast.success('Contact added successfully!')
        setAddContactDialogOpen(false)
        setNewContact({
          firstName: '',
          lastName: '',
          email: '',
          company: '',
          city: '',
          province: '',
          postcode: '',
          phone: '',
          website: '',
          language: 'nl',
        })
        fetchContacts()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to add contact')
      }
    } catch (error) {
      console.error('Add contact error:', error)
      toast.error('Failed to add contact')
    } finally {
      setUploading(false)
    }
  }

  const filteredContacts = contacts.filter(contact => {
    const search = searchTerm.toLowerCase()
    return (
      contact.email.toLowerCase().includes(search) ||
      contact.firstName?.toLowerCase().includes(search) ||
      contact.lastName?.toLowerCase().includes(search) ||
      contact.company?.toLowerCase().includes(search) ||
      contact.city?.toLowerCase().includes(search)
    )
  })

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Contacts</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadExample}>
            <Download className="mr-2 h-4 w-4" />
            Example File
          </Button>
          <Button variant="outline" onClick={() => setAddContactDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Contact
          </Button>
          <Button onClick={() => setImportDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import Contacts
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Contacts</CardTitle>
              <CardDescription>
                {totalContacts} total contacts • Page {currentPage} of {totalPages}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <select
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value)}
              >
                <option value="">All Languages</option>
                <option value="nl">🇳🇱 Dutch</option>
                <option value="fr">🇫🇷 French</option>
              </select>
              <select
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
                <option value="500">500 per page</option>
                <option value="1000">1000 per page</option>
              </select>
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-[300px]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-[400px]">
              <p className="text-muted-foreground">Loading contacts...</p>
            </div>
          ) : contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[400px] text-center">
              <p className="text-muted-foreground mb-4">
                No contacts yet. Import your first contacts from an Excel or CSV file.
              </p>
              <Button onClick={() => setImportDialogOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Import Contacts
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>First Name</TableHead>
                  <TableHead>Last Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">
                      {contact.firstName || '-'}
                    </TableCell>
                    <TableCell className="font-medium">
                      {contact.lastName || '-'}
                    </TableCell>
                    <TableCell>{contact.email}</TableCell>
                    <TableCell>{contact.company || '-'}</TableCell>
                    <TableCell>{contact.city || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={contact.language === 'nl' ? 'default' : 'secondary'}>
                        {contact.language === 'nl' ? '🇳🇱 Dutch' : '🇫🇷 French'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(contact.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalContacts)} of {totalContacts} contacts
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={addContactDialogOpen} onOpenChange={setAddContactDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Contact</DialogTitle>
            <DialogDescription>
              Manually add a single contact to your list
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">First Name</label>
                <Input
                  placeholder="John"
                  value={newContact.firstName}
                  onChange={(e) => setNewContact({ ...newContact, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Name</label>
                <Input
                  placeholder="Doe"
                  value={newContact.lastName}
                  onChange={(e) => setNewContact({ ...newContact, lastName: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email *</label>
              <Input
                type="email"
                placeholder="john.doe@example.com"
                value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Company</label>
              <Input
                placeholder="Company Name"
                value={newContact.company}
                onChange={(e) => setNewContact({ ...newContact, company: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">City</label>
                <Input
                  placeholder="Brussels"
                  value={newContact.city}
                  onChange={(e) => setNewContact({ ...newContact, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Province</label>
                <Input
                  placeholder="Bruxelles-Capitale"
                  value={newContact.province}
                  onChange={(e) => setNewContact({ ...newContact, province: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <Input
                  placeholder="+32 2 123 45 67"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Language</label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={newContact.language}
                  onChange={(e) => setNewContact({ ...newContact, language: e.target.value })}
                >
                  <option value="nl">🇳🇱 Dutch</option>
                  <option value="fr">🇫🇷 French</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddContactDialogOpen(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button onClick={handleAddContact} disabled={!newContact.email || uploading}>
              {uploading ? 'Adding...' : 'Add Contact'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={importDialogOpen} onOpenChange={(open) => {
        setImportDialogOpen(open)
        if (!open) {
          setSelectedFile(null)
          setPreviewData(null)
          setShowMapping(false)
          setColumnMapping({})
        }
      }}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Contacts</DialogTitle>
            <DialogDescription>
              {!showMapping ? 'Upload an Excel (.xlsx, .xls) or CSV file with your contacts.' : 'Map your columns to the correct fields'}
            </DialogDescription>
          </DialogHeader>
          
          {!showMapping ? (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  disabled={uploading}
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                onClick={downloadExample}
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Example File
              </Button>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Map your columns:</p>
                <div className="grid gap-2">
                  {previewData?.headers.map((header) => (
                    <div key={header} className="flex items-center gap-2">
                      <Badge variant="outline" className="min-w-[150px]">{header}</Badge>
                      <span className="text-muted-foreground">→</span>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                        value={columnMapping[header] || ''}
                        onChange={(e) => {
                          setColumnMapping(prev => ({
                            ...prev,
                            [header]: e.target.value
                          }))
                        }}
                      >
                        <option value="">-- Skip this column --</option>
                        <option value="email">Email (required)</option>
                        <option value="first_name">First Name</option>
                        <option value="last_name">Last Name</option>
                        <option value="company">Company</option>
                        <option value="city">City</option>
                        <option value="province">Province</option>
                        <option value="postcode">Postcode</option>
                        <option value="region">Region</option>
                        <option value="website">Website</option>
                        <option value="phone">Phone</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Preview (first 3 rows):</p>
                <div className="border rounded-md overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {previewData?.headers.map((header) => (
                          <TableHead key={header}>{header}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData?.rows.slice(0, 3).map((row, idx) => (
                        <TableRow key={idx}>
                          {row.map((cell, cellIdx) => (
                            <TableCell key={cellIdx}>{cell || '-'}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              {!columnMapping['email'] && (
                <p className="text-sm text-destructive">⚠️ Email column is required</p>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (showMapping) {
                  setShowMapping(false)
                  setPreviewData(null)
                  setColumnMapping({})
                } else {
                  setImportDialogOpen(false)
                  setSelectedFile(null)
                }
              }}
              disabled={uploading}
            >
              {showMapping ? 'Back' : 'Cancel'}
            </Button>
            {showMapping && (
              <Button onClick={handleImport} disabled={!columnMapping['email'] || uploading}>
                {uploading ? 'Importing...' : `Import ${previewData?.rows.length || 0} contacts`}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
