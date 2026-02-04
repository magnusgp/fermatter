import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FileText,
  Home,
  Files,
  Library,
  Settings,
  LogOut,
  Loader2,
  Plus,
  BookOpen,
  ExternalLink,
  Trash2,
  Search,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useAuth } from '@/lib/auth'
import {
  subscribeToUserSources,
  createSource,
  deleteSource,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  type LibrarySource,
} from '@/lib/sources'

export function LibraryPage() {
  const { user, isAuthenticated, isLoading: authLoading, signOut } = useAuth()
  const navigate = useNavigate()

  const [sources, setSources] = useState<LibrarySource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Form state for new source
  const [newSource, setNewSource] = useState({
    title: '',
    url: '',
    snippet: '',
    category: 'custom' as LibrarySource['category'],
  })

  // Redirect to landing if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/')
    }
  }, [authLoading, isAuthenticated, navigate])

  // Subscribe to sources
  useEffect(() => {
    if (!user?.id) return

    const unsubscribe = subscribeToUserSources(user.id, (sourcesData) => {
      setSources(sourcesData)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [user?.id])

  // Filter sources
  const filteredSources = sources.filter((source) => {
    const matchesSearch =
      searchQuery === '' ||
      source.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      source.snippet.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = !selectedCategory || source.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  // Group by built-in vs custom
  const builtInSources = filteredSources.filter((s) => s.isBuiltIn)
  const customSources = filteredSources.filter((s) => !s.isBuiltIn)

  // Handle create source
  const handleCreateSource = async () => {
    if (!user?.id || !newSource.title || !newSource.snippet) return

    setIsCreating(true)
    try {
      await createSource({
        userId: user.id,
        title: newSource.title,
        url: newSource.url,
        snippet: newSource.snippet,
        category: newSource.category,
      })
      setShowAddDialog(false)
      setNewSource({ title: '', url: '', snippet: '', category: 'custom' })
    } catch (error) {
      console.error('Failed to create source:', error)
    } finally {
      setIsCreating(false)
    }
  }

  // Handle delete source
  const handleDeleteSource = async (sourceId: string) => {
    if (!confirm('Are you sure you want to delete this source?')) return
    
    try {
      await deleteSource(sourceId)
    } catch (error) {
      console.error('Failed to delete source:', error)
    }
  }

  // Get color classes for category
  const getCategoryColorClasses = (category: LibrarySource['category']) => {
    const color = CATEGORY_COLORS[category]
    switch (color) {
      case 'blue':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'green':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'amber':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'purple':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  // Show loading state while checking auth
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Don't render if not authenticated (redirect will happen)
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
                <Link to="/documents">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Files className="h-4 w-4" />
                    <span>Documents</span>
                  </Button>
                </Link>
                <Link to="/library">
                  <Button variant="ghost" size="sm" className="gap-2 bg-accent">
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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Source Library</h2>
              <p className="text-muted-foreground">
                Reference sources and style guides for your writing analysis.
              </p>
            </div>
            <Button onClick={() => setShowAddDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Source
            </Button>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search sources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant={selectedCategory === null ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                All
              </Button>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <Button
                  key={key}
                  variant={selectedCategory === key ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(key)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Built-in Sources */}
        {builtInSources.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Built-in Sources
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {builtInSources.map((source, index) => (
                <motion.div
                  key={source.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <Card className="p-5 border-border hover:border-primary/50 transition-colors h-full">
                    <div className="flex items-start justify-between mb-3">
                      <Badge
                        variant="outline"
                        className={`text-xs ${getCategoryColorClasses(source.category)}`}
                      >
                        {CATEGORY_LABELS[source.category]}
                      </Badge>
                      {source.url && (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary transition"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                    <h4 className="font-semibold text-foreground mb-2">{source.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      "{source.snippet}"
                    </p>
                    <div className="mt-3 pt-3 border-t">
                      <span className="text-xs text-muted-foreground font-mono">
                        [{source.id}]
                      </span>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Custom Sources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Your Custom Sources
          </h3>

          {customSources.length === 0 ? (
            <Card className="p-12 border-border text-center">
              <Library className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h4 className="font-semibold text-foreground mb-2">No custom sources yet</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Add your own reference sources to use in document analysis.
              </p>
              <Button onClick={() => setShowAddDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Source
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customSources.map((source, index) => (
                <motion.div
                  key={source.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                >
                  <Card className="p-5 border-border hover:border-primary/50 transition-colors h-full">
                    <div className="flex items-start justify-between mb-3">
                      <Badge
                        variant="outline"
                        className={`text-xs ${getCategoryColorClasses(source.category)}`}
                      >
                        {CATEGORY_LABELS[source.category]}
                      </Badge>
                      <div className="flex items-center gap-2">
                        {source.url && (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary transition"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteSource(source.id)}
                          className="text-muted-foreground hover:text-destructive transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <h4 className="font-semibold text-foreground mb-2">{source.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      "{source.snippet}"
                    </p>
                    <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                      Added {source.createdAt.toLocaleDateString()}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Add Source Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Source</DialogTitle>
            <DialogDescription>
              Add a new reference source to your library. It will be available in document analysis.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title *</label>
              <input
                type="text"
                value={newSource.title}
                onChange={(e) => setNewSource({ ...newSource, title: e.target.value })}
                placeholder="e.g., Harvard Writing Guide"
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">URL (optional)</label>
              <input
                type="url"
                value={newSource.url}
                onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                placeholder="https://example.com/guide"
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <select
                value={newSource.category}
                onChange={(e) =>
                  setNewSource({
                    ...newSource,
                    category: e.target.value as LibrarySource['category'],
                  })
                }
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Key Snippet / Quote *</label>
              <textarea
                value={newSource.snippet}
                onChange={(e) => setNewSource({ ...newSource, snippet: e.target.value })}
                placeholder="A memorable quote or key principle from this source..."
                rows={3}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
              <p className="text-xs text-muted-foreground">
                This will be shown to the AI when analyzing documents.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateSource}
                disabled={isCreating || !newSource.title || !newSource.snippet}
              >
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Source'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default LibraryPage
