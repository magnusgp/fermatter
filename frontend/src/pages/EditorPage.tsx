import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FeedbackPanel } from '@/components/FeedbackPanel'
import { SettingsDialog, loadDocumentContext } from '@/components/SettingsDialog'
import { analyzeText } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import {
  getDocument,
  updateDocument,
  createDocument,
  incrementWritingTime,
  type Document,
} from '@/lib/documents'
import type {
  Snapshot,
  AnalyzeResponse,
  SourcesInput,
  Observation,
} from '@/lib/types'
import { FileText, Settings, Send, Home, Files, Library, LogOut, Loader2, Save, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const MAX_SNAPSHOTS = 20
const SNAPSHOT_INTERVAL_MS = 10000
const AUTO_SAVE_INTERVAL_MS = 5000

// Split text into paragraphs (separated by blank lines)
function splitIntoParagraphs(text: string): { id: string; content: string; start: number; end: number }[] {
  const result: { id: string; content: string; start: number; end: number }[] = []
  const regex = /[^\n]+(?:\n(?!\n)[^\n]*)*/g
  let match
  let idx = 0
  
  while ((match = regex.exec(text)) !== null) {
    if (match[0].trim()) {
      result.push({
        id: `p${idx}`,
        content: match[0],
        start: match.index,
        end: match.index + match[0].length,
      })
      idx++
    }
  }
  
  return result
}

// Find absolute position of anchor text within full text
function findAnchorPosition(
  paragraphs: { start: number; end: number; content: string }[],
  paragraphIndex: number,
  anchorText: string
): { start: number; end: number } | null {
  const para = paragraphs[paragraphIndex]
  if (!para) return null
  
  const lowerContent = para.content.toLowerCase()
  const lowerAnchor = anchorText.toLowerCase()
  const relativeIndex = lowerContent.indexOf(lowerAnchor)
  
  if (relativeIndex === -1) return null
  
  return {
    start: para.start + relativeIndex,
    end: para.start + relativeIndex + anchorText.length,
  }
}

// Escape HTML for safety
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br>')
}

export function EditorPage() {
  const { user, isAuthenticated, isLoading: authLoading, signOut } = useAuth()
  const navigate = useNavigate()
  const { documentId } = useParams<{ documentId?: string }>()

  // Redirect to landing if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/')
    }
  }, [authLoading, isAuthenticated, navigate])

  // Document state
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null)
  const [isLoadingDoc, setIsLoadingDoc] = useState(!!documentId)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [title, setTitle] = useState('Untitled Document')

  // Text state
  const [text, setText] = useState('')
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])

  // Analysis state
  const [analysisResult, setAnalysisResult] = useState<AnalyzeResponse | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // UI state
  const [showSettings, setShowSettings] = useState(false)
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set())
  const [hoveredNote, setHoveredNote] = useState<string | null>(null)
  const [activeNote, setActiveNote] = useState<string | null>(null)

  // Analysis settings (mode fixed to scientific, can be changed in settings)
  const [sources, setSources] = useState<SourcesInput>({ user: [], library_ids: [] })
  const [documentContext, setDocumentContext] = useState(() => loadDocumentContext())
  const [mode, setMode] = useState<'scientific' | 'journalist' | 'email' | 'general'>('scientific')

  // Refs
  const editorRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)
  const marginRef = useRef<HTMLDivElement>(null)
  const lastTextRef = useRef(text)
  const lastSavedTextRef = useRef(text)
  const feedbackRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  // Load document if documentId is provided
  useEffect(() => {
    async function loadDocument() {
      if (!documentId || !user?.id) return

      setIsLoadingDoc(true)
      try {
        const doc = await getDocument(documentId)
        if (doc && doc.userId === user.id) {
          setCurrentDocument(doc)
          setText(doc.content)
          setTitle(doc.title)
          setMode(doc.mode)
          lastSavedTextRef.current = doc.content
          if (doc.sources) setSources(doc.sources)
          if (doc.documentContext) setDocumentContext(doc.documentContext)
        } else {
          // Document not found or not owned by user
          navigate('/documents')
        }
      } catch (err) {
        console.error('Failed to load document:', err)
        setError('Failed to load document')
      } finally {
        setIsLoadingDoc(false)
      }
    }

    if (isAuthenticated && user?.id) {
      loadDocument()
    }
  }, [documentId, user?.id, isAuthenticated, navigate])

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(text !== lastSavedTextRef.current || title !== currentDocument?.title)
  }, [text, title, currentDocument?.title])

  // Track writing time (every 60 seconds of active editing)
  useEffect(() => {
    if (!user?.id) return

    let writingSeconds = 0
    const interval = setInterval(() => {
      // Only count if there's content and user has been active
      if (text.trim().length > 0) {
        writingSeconds += 60
        // Save every minute
        incrementWritingTime(user.id, 60).catch(console.error)
      }
    }, 60000) // Every minute

    return () => {
      clearInterval(interval)
      // Save any remaining time on unmount (if at least 10 seconds)
      if (writingSeconds >= 10) {
        incrementWritingTime(user.id, writingSeconds % 60).catch(console.error)
      }
    }
  }, [user?.id, text])

  // Auto-save document
  useEffect(() => {
    if (!hasUnsavedChanges || !user?.id) return

    const timer = setTimeout(async () => {
      await saveDocument()
    }, AUTO_SAVE_INTERVAL_MS)

    return () => clearTimeout(timer)
  }, [text, title, hasUnsavedChanges, user?.id])

  // Save document function
  const saveDocument = useCallback(async () => {
    if (!user?.id || isSaving) return

    setIsSaving(true)
    try {
      if (currentDocument) {
        // Update existing document
        await updateDocument(currentDocument.id, {
          title,
          content: text,
          mode,
          sources,
          documentContext,
          feedbackCount: analysisResult?.observations?.length || currentDocument.feedbackCount,
        })
        lastSavedTextRef.current = text
        setLastSaved(new Date())
        setHasUnsavedChanges(false)
      } else {
        // Create new document
        const newDoc = await createDocument({
          userId: user.id,
          title,
          content: text,
          mode,
          sources,
          documentContext,
        })
        setCurrentDocument(newDoc)
        lastSavedTextRef.current = text
        setLastSaved(new Date())
        setHasUnsavedChanges(false)
        // Update URL without navigation
        window.history.replaceState(null, '', `/editor/${newDoc.id}`)
      }
    } catch (err) {
      console.error('Failed to save document:', err)
      setError('Failed to save document')
    } finally {
      setIsSaving(false)
    }
  }, [user?.id, currentDocument, title, text, mode, sources, documentContext, analysisResult, isSaving])

  // Parse paragraphs with positions
  const paragraphs = useMemo(() => splitIntoParagraphs(text), [text])

  // Get the current highlighted observation
  const highlightedObservation = useMemo(() => {
    const noteId = hoveredNote || activeNote
    if (!noteId || !analysisResult) return null
    return analysisResult.observations.find((o) => o.id === noteId) || null
  }, [hoveredNote, activeNote, analysisResult])

  // Build highlighted text with marks
  const highlightedContent = useMemo(() => {
    if (!highlightedObservation?.anchor_text) {
      return escapeHtml(text).replace(/\n/g, '<br>')
    }

    const position = findAnchorPosition(
      paragraphs,
      highlightedObservation.paragraph,
      highlightedObservation.anchor_text
    )

    if (!position) {
      return escapeHtml(text).replace(/\n/g, '<br>')
    }

    const before = text.slice(0, position.start)
    const highlighted = text.slice(position.start, position.end)
    const after = text.slice(position.end)

    // Return HTML with highlight mark - no px padding to avoid distortion
    return `${escapeHtml(before)}<mark class="bg-yellow-200 dark:bg-yellow-600/50 rounded-sm">${escapeHtml(highlighted)}</mark>${escapeHtml(after)}`
  }, [text, highlightedObservation, paragraphs])

  // Sync scroll between textarea and highlight layer
  const syncScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft
    }
  }, [])

  // Create snapshot
  const createSnapshot = useCallback(() => {
    if (!text.trim() || text === lastTextRef.current) return

    const snapshot: Snapshot = {
      ts: new Date().toISOString(),
      text: text,
    }

    setSnapshots((prev) => {
      const updated = [...prev, snapshot]
      if (updated.length > MAX_SNAPSHOTS) {
        return updated.slice(-MAX_SNAPSHOTS)
      }
      return updated
    })

    lastTextRef.current = text
  }, [text])

  // Auto-snapshot
  useEffect(() => {
    const interval = setInterval(createSnapshot, SNAPSHOT_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [createSnapshot])

  // Handle analyze
  const handleAnalyze = useCallback(async () => {
    if (!text.trim()) return

    setIsAnalyzing(true)
    setError(null)
    setActiveNote(null)
    setExpandedNotes(new Set())

    createSnapshot()

    // Map document mode to API AnalysisMode
    const modeToApiMode = (m: typeof mode): 'scientific' | 'journalist' | 'grandma' => {
      switch (m) {
        case 'scientific': return 'scientific'
        case 'journalist': return 'journalist'
        case 'email': return 'grandma'
        case 'general': return 'scientific'
        default: return 'scientific'
      }
    }

    try {
      const result = await analyzeText({
        text,
        snapshots,
        mode: modeToApiMode(mode),
        sources,
        goal: documentContext || undefined,
        scope: { type: 'document' },
      })
      setAnalysisResult(result)

      // Update document with feedback count and last analyzed time
      if (currentDocument) {
        await updateDocument(currentDocument.id, {
          feedbackCount: result.observations?.length || 0,
          lastAnalyzedAt: new Date(),
        })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to analyze text'
      setError(message)
      console.error('Analysis error:', err)
    } finally {
      setIsAnalyzing(false)
    }
  }, [text, snapshots, mode, sources, documentContext, createSnapshot, currentDocument])

  // Handle observation active change for FeedbackPanel
  const handleActiveChange = useCallback((obs: Observation | null) => {
    setActiveNote(obs?.id || null)
  }, [])

  // Handle hover for FeedbackPanel
  const handleHover = useCallback((obs: Observation | null) => {
    setHoveredNote(obs?.id || null)
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.max(500, textareaRef.current.scrollHeight)}px`
    }
  }, [text])

  // Show loading state while checking auth or loading document
  if (authLoading || isLoadingDoc) {
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
    <div className="min-h-screen bg-background">
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
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Library className="h-4 w-4" />
                    <span>Library</span>
                  </Button>
                </Link>
              </nav>

              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)}>
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

      {/* Error banner */}
      {error && (
        <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2">
          <p className="text-sm text-destructive container mx-auto">{error}</p>
        </div>
      )}

      {/* Main Layout */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          {/* Editor */}
          <div
            ref={editorRef}
            className="bg-card rounded-lg border p-8 shadow-sm min-h-[600px]"
          >
            {/* Editor header with title and analyze button */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b">
              <div className="flex-1 min-w-0 mr-4">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Untitled Document"
                  className="text-lg font-medium text-foreground bg-transparent border-0 outline-none w-full focus:ring-0 placeholder:text-muted-foreground/50"
                />
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <span>{paragraphs.length} paragraph{paragraphs.length !== 1 ? 's' : ''}</span>
                  <span>·</span>
                  {isSaving ? (
                    <span className="flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Saving...
                    </span>
                  ) : hasUnsavedChanges ? (
                    <span className="text-amber-600">Unsaved changes</span>
                  ) : lastSaved ? (
                    <span className="flex items-center gap-1 text-green-600">
                      <Check className="h-3 w-3" />
                      Saved
                    </span>
                  ) : (
                    <span>Ctrl+Enter to analyze</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={saveDocument}
                  disabled={isSaving || !hasUnsavedChanges}
                  variant="outline"
                  size="sm"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !text.trim()}
                  size="sm"
                >
                  {isAnalyzing ? (
                    <span className="animate-pulse">Analyzing...</span>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Analyze
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Editor with highlight overlay */}
            <div className="relative font-mono text-sm leading-relaxed">
              {/* Highlight backdrop layer - shows highlights behind text */}
              <div
                ref={highlightRef}
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none whitespace-pre-wrap break-words overflow-hidden"
                style={{
                  color: 'transparent',
                  wordBreak: 'break-word',
                }}
                dangerouslySetInnerHTML={{ __html: highlightedContent }}
              />

              {/* Actual textarea for editing */}
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onScroll={syncScroll}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault()
                    handleAnalyze()
                  }
                }}
                placeholder="Start writing here...

Separate paragraphs with blank lines.
Press Ctrl+Enter (Cmd+Enter) to analyze."
                className={cn(
                  'relative w-full min-h-[500px] resize-none bg-transparent border-0',
                  'focus:outline-none focus:ring-0',
                  'placeholder:text-muted-foreground/50'
                )}
                style={{
                  background: 'transparent',
                  caretColor: 'currentColor',
                }}
              />
            </div>
          </div>

          {/* Feedback Margin */}
          <div ref={marginRef} className="lg:sticky lg:top-24 h-fit">
            <FeedbackPanel
              observations={analysisResult?.observations || []}
              sourcesUsed={analysisResult?.sources_used || []}
              meta={analysisResult?.meta || null}
              expandedId={Array.from(expandedNotes)[0] || null}
              onExpandChange={(id) => {
                if (id) {
                  setExpandedNotes(new Set([id]))
                } else {
                  setExpandedNotes(new Set())
                }
              }}
              activeId={activeNote}
              onActiveChange={handleActiveChange}
              onHover={handleHover}
              feedbackRefs={feedbackRefs}
              isLoading={isAnalyzing}
            />
          </div>
        </div>
      </div>

      {/* Settings modal */}
      <SettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
        documentContext={documentContext}
        onDocumentContextChange={setDocumentContext}
        sources={sources}
        onSourcesChange={setSources}
        mode="scientific"
      />
    </div>
  )
}

export default EditorPage
