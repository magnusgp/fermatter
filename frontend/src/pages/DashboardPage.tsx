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
  Clock,
  TrendingUp,
  Target,
  AlertCircle,
  Plus,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/lib/auth'
import {
  getRecentDocuments,
  subscribeToUserMetrics,
  initializeUserMetrics,
  formatWritingTime,
  formatRelativeTime,
  createDocument,
  type Document,
  type UserMetrics,
} from '@/lib/documents'

// Mode colors
const MODE_COLORS: Record<string, string> = {
  scientific: 'blue',
  journalist: 'amber',
  email: 'green',
  general: 'purple',
}

export function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading, signOut } = useAuth()
  const navigate = useNavigate()

  const [recentDocuments, setRecentDocuments] = useState<Document[]>([])
  const [metrics, setMetrics] = useState<UserMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)

  // Redirect to landing if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/')
    }
  }, [authLoading, isAuthenticated, navigate])

  // Load recent documents and metrics
  useEffect(() => {
    async function loadData() {
      if (!user?.id) return

      try {
        // Initialize metrics if needed
        await initializeUserMetrics(user.id)

        // Load recent documents
        const docs = await getRecentDocuments(user.id, 3)
        setRecentDocuments(docs)
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    if (isAuthenticated && user?.id) {
      loadData()
    }
  }, [user?.id, isAuthenticated])

  // Subscribe to metrics updates
  useEffect(() => {
    if (!user?.id) return

    const unsubscribe = subscribeToUserMetrics(user.id, (m) => {
      setMetrics(m)
    })

    return () => unsubscribe()
  }, [user?.id])

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

  // Get color classes
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50 text-blue-600'
      case 'amber':
        return 'bg-amber-50 text-amber-600'
      case 'green':
        return 'bg-green-50 text-green-600'
      case 'purple':
        return 'bg-purple-50 text-purple-600'
      default:
        return 'bg-gray-50 text-gray-600'
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
                  <Button variant="ghost" size="sm" className="gap-2 bg-accent">
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
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
          </h2>
          <p className="text-muted-foreground">
            Here's what's happening with your writing today.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6 border-border hover:border-primary/50 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <Badge variant="outline" className="text-xs">
                  All time
                </Badge>
              </div>
              <p className="text-2xl font-bold text-foreground mb-1">
                {metrics ? formatWritingTime(metrics.writingTimeSeconds) : '0 min'}
              </p>
              <p className="text-sm text-muted-foreground">Writing time</p>
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <span>Time spent in editor</span>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 border-border hover:border-primary/50 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Target className="h-5 w-5 text-amber-600" />
                </div>
                <Badge variant="outline" className="text-xs">
                  Total
                </Badge>
              </div>
              <p className="text-2xl font-bold text-foreground mb-1">
                {metrics?.totalDocuments ?? 0} documents
              </p>
              <p className="text-sm text-muted-foreground">Created</p>
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <span>{recentDocuments.length} recently active</span>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6 border-border hover:border-primary/50 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-green-600" />
                </div>
                <Badge variant="outline" className="text-xs">
                  Resolved
                </Badge>
              </div>
              <p className="text-2xl font-bold text-foreground mb-1">
                {metrics?.totalFeedbackResolved ?? 0} issues
              </p>
              <p className="text-sm text-muted-foreground">Fixed</p>
              <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                <TrendingUp className="h-3 w-3" />
                <span>Feedback improvements</span>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Recent Documents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-foreground">Recent documents</h3>
            <Link to="/documents">
              <Button variant="ghost" size="sm" className="gap-2">
                View all
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {recentDocuments.length === 0 ? (
            <Card className="p-12 border-border text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h4 className="font-semibold text-foreground mb-2">No documents yet</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first document to get started.
              </p>
              <Button onClick={handleCreateDocument} disabled={isCreating} className="gap-2">
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                New document
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentDocuments.map((doc, index) => {
                const color = MODE_COLORS[doc.mode] || 'purple'
                const wordCount = doc.content?.split(/\s+/).filter(Boolean).length ?? 0
                return (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                  >
                    <Link to={`/editor/${doc.id}`}>
                      <Card className="p-6 border-border hover:border-primary/50 transition-colors cursor-pointer h-full">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded ${getColorClasses(color)}`}>
                              <FileText className="h-4 w-4" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-foreground">{doc.title}</h4>
                              <p className="text-xs text-muted-foreground">
                                Last edited {formatRelativeTime(doc.updatedAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs mb-3 capitalize">
                          {doc.mode}
                        </Badge>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {doc.content?.slice(0, 150) || 'No content yet...'}
                        </p>
                        <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                          <span>{wordCount.toLocaleString()} words</span>
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h3 className="text-xl font-semibold text-foreground mb-4">Quick actions</h3>
          <div className="flex gap-4">
            <Button onClick={handleCreateDocument} disabled={isCreating} className="gap-2">
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              New document
            </Button>
            <Link to="/library">
              <Button variant="outline" className="gap-2">
                <Library className="h-4 w-4" />
                Browse sources
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default DashboardPage
