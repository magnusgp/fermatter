import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { FeedbackPanel } from '@/components/FeedbackPanel'
import { SettingsDialog, loadDocumentContext } from '@/components/SettingsDialog'
import { analyzeText } from '@/lib/api'
import type {
  Snapshot,
  AnalyzeResponse,
  SourcesInput,
  Observation,
} from '@/lib/types'
import { FileText, Settings, Send, Home, Files, Library } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const MAX_SNAPSHOTS = 20
const SNAPSHOT_INTERVAL_MS = 10000

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

  // Refs
  const editorRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)
  const marginRef = useRef<HTMLDivElement>(null)
  const lastTextRef = useRef(text)
  const feedbackRefs = useRef<Map<string, HTMLDivElement>>(new Map())

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

    try {
      const result = await analyzeText({
        text,
        snapshots,
        mode: 'scientific', // Fixed mode
        sources,
        goal: documentContext || undefined,
        scope: { type: 'document' },
      })
      setAnalysisResult(result)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to analyze text'
      setError(message)
      console.error('Analysis error:', err)
    } finally {
      setIsAnalyzing(false)
    }
  }, [text, snapshots, sources, documentContext, createSnapshot])

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold text-foreground">Fermatter</h1>
            </Link>

            <div className="flex items-center gap-6">
              <nav className="flex items-center gap-1">
                <Link to="/">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Home className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Files className="h-4 w-4" />
                  <span>Documents</span>
                </Button>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Library className="h-4 w-4" />
                  <span>Library</span>
                </Button>
              </nav>

              <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)}>
                <Settings className="h-5 w-5" />
              </Button>
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
            {/* Editor header with analyze button */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b">
              <div>
                <h2 className="text-lg font-medium text-foreground">Document</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {paragraphs.length} paragraph{paragraphs.length !== 1 ? 's' : ''} · Ctrl+Enter to analyze
                </p>
              </div>
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
