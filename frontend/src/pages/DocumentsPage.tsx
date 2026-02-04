import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Home,
  Files,
  Library,
  Settings,
  LogOut,
  Loader2,
  Plus,
  Search,
  MoreVertical,
  Trash2,
  Edit3,
  Clock,
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useAuth } from '@/lib/auth'
import {
  subscribeToUserDocuments,
  deleteDocument,
  createDocument,
  formatRelativeTime,
  type Document,
} from '@/lib/documents'

// Mode colors
const MODE_COLORS: Record<string, { bg: string; text: string }> = {
  scientific: { bg: 'bg-blue-50', text: 'text-blue-600' },
  journalist: { bg: 'bg-amber-50', text: 'text-amber-600' },
  email: { bg: 'bg-green-50', text: 'text-green-600' },
  general: { bg: 'bg-purple-50', text: 'text-purple-600' },
}

export function DocumentsPage() {
  const { user, isAuthenticated, isLoading: authLoading, signOut } = useAuth()
  const navigate = useNavigate()

  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMode, setFilterMode] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // Redirect to landing if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/')
    }
  }, [authLoading, isAuthenticated, navigate])

  // Subscribe to user documents
  useEffect(() => {
    if (!user?.id) return

    const unsubscribe = subscribeToUserDocuments(user.id, (docs) => {
      setDocuments(docs)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [user?.id])

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      searchQuery === '' ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = filterMode === null || doc.mode === filterMode

    return matchesSearch && matchesFilter
  })

  // Create new document
  const handleCreateDocument = async () => {
    if (!user?.id) return

    setIsCreating(true)
    try {
      const newDoc = await createDocument({
        userId: user.id,
        title: 'Untitled Document',
        content: '',
        mode: 'scientific',
      })
      navigate(`/editor/${newDoc.id}`)
    } catch (error) {
      console.error('Failed to create document:', error)
    } finally {
      setIsCreating(false)
    }
  }

  // Delete document
  const handleDeleteDocument = async (docId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      await deleteDocument(docId)
    } catch (error) {
      console.error('Failed to delete document:', error)
    }
  }

  // Get mode color classes
  const getModeColors = (mode: string) => {
    return MODE_COLORS[mode] || MODE_COLORS.general
  }

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold text-foreground">Fermatter</h1>
            </Link>

            <div className="flex items-center gap-6">
              <nav className="flex items-center gap-1">
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Home className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" className="gap-2 bg-accent">
                  <Files className="h-4 w-4" />
                  <span>Documents</span>
                </Button>
                <Link to="/library">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Library className="h-4 w-4" />
                    <span>Library</span>
                  </Button>
                </Link>
              </nav>

              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>

                {user && (
                  <div className="flex items-center gap-2 pl-3 border-l">
                    <img
                      src={user.imageUrl}
                      alt={user.name}
                      className="w-8 h-8 rounded-full"
                      title={user.email}
                    />
                    <button
                      onClick={signOut}
                      className="text-muted-foreground hover:text-foreground transition"
                      title="Sign out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Documents</h2>
              <p className="text-muted-foreground">
                {documents.length} document{documents.length !== 1 ? 's' : ''} in your library
              </p>
            </div>
            <Button className="gap-2" onClick={handleCreateDocument} disabled={isCreating}>
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              New Document
            </Button>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* Filter by mode */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  {filterMode ? filterMode.charAt(0).toUpperCase() + filterMode.slice(1) : 'All modes'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2">
                <div className="space-y-1">
                  <button
                    onClick={() => setFilterMode(null)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition ${
                      filterMode === null ? 'bg-accent' : 'hover:bg-accent/50'
                    }`}
                  >
                    All modes
                  </button>
                  {['scientific', 'journalist', 'email', 'general'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setFilterMode(mode)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition ${
                        filterMode === mode ? 'bg-accent' : 'hover:bg-accent/50'
                      }`}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </motion.div>

        {/* Documents Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredDocuments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center py-20"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Files className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {searchQuery || filterMode ? 'No documents found' : 'No documents yet'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery || filterMode
                ? 'Try adjusting your search or filters'
                : 'Create your first document to get started'}
            </p>
            {!searchQuery && !filterMode && (
              <Button className="gap-2" onClick={handleCreateDocument} disabled={isCreating}>
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Create Document
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredDocuments.map((doc, index) => {
                const modeColors = getModeColors(doc.mode)
                
                return (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    layout
                  >
                    <Link to={`/editor/${doc.id}`}>
                      <Card className="p-6 border-border hover:border-primary/50 transition-colors cursor-pointer h-full group">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`p-2 rounded ${modeColors.bg} ${modeColors.text}`}>
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-foreground truncate">
                                {doc.title}
                              </h4>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{formatRelativeTime(doc.updatedAt)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Actions Menu */}
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                onClick={(e) => e.preventDefault()}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-accent transition"
                              >
                                <MoreVertical className="h-4 w-4 text-muted-foreground" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-40 p-2" align="end">
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  navigate(`/editor/${doc.id}`)
                                }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-accent transition"
                              >
                                <Edit3 className="h-4 w-4" />
                                Edit
                              </button>
                              <button
                                onClick={(e) => handleDeleteDocument(doc.id, e)}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-destructive/10 text-destructive transition"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </button>
                            </PopoverContent>
                          </Popover>
                        </div>

                        <Badge variant="outline" className="text-xs mb-3">
                          {doc.mode.charAt(0).toUpperCase() + doc.mode.slice(1)}
                        </Badge>

                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {doc.content || 'No content yet...'}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{doc.feedbackCount} feedback notes</span>
                          <span>•</span>
                          <span>{doc.wordCount.toLocaleString()} words</span>
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}

export default DocumentsPage
