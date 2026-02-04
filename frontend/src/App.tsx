import { useState, useEffect, useCallback, useRef } from 'react'
import { Editor } from '@/components/Editor'
import { FeedbackPanel } from '@/components/FeedbackPanel'
import { ModeSelector } from '@/components/ModeSelector'
import { SourcesPanel } from '@/components/SourcesPanel'
import { InstabilityMap } from '@/components/InstabilityMap'
import { analyzeText } from '@/lib/api'
import type {
  Snapshot,
  AnalyzeResponse,
  AnalysisMode,
  SourcesInput,
} from '@/lib/types'
import { FileText, Settings2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

const MAX_SNAPSHOTS = 20
const SNAPSHOT_INTERVAL_MS = 10000 // 10 seconds

function App() {
  const [text, setText] = useState('')
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [analysisResult, setAnalysisResult] = useState<AnalyzeResponse | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [highlightedParagraph, setHighlightedParagraph] = useState<number | null>(null)
  
  // Analysis settings
  const [mode, setMode] = useState<AnalysisMode>('scientific')
  const [sources, setSources] = useState<SourcesInput>({ user: [], library_ids: [] })
  const [showSettings, setShowSettings] = useState(false)
  
  const lastTextRef = useRef(text)

  // Create a snapshot
  const createSnapshot = useCallback(() => {
    if (!text.trim() || text === lastTextRef.current) return
    
    const snapshot: Snapshot = {
      ts: new Date().toISOString(),
      text: text,
    }
    
    setSnapshots((prev) => {
      const updated = [...prev, snapshot]
      // Keep only the last MAX_SNAPSHOTS
      if (updated.length > MAX_SNAPSHOTS) {
        return updated.slice(-MAX_SNAPSHOTS)
      }
      return updated
    })
    
    lastTextRef.current = text
  }, [text])

  // Auto-snapshot every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      createSnapshot()
    }, SNAPSHOT_INTERVAL_MS)
    
    return () => clearInterval(interval)
  }, [createSnapshot])

  // Handle full document analyze
  const handleAnalyze = useCallback(async () => {
    if (!text.trim()) return
    
    setIsAnalyzing(true)
    setError(null)
    
    // Create a snapshot before analyzing
    createSnapshot()
    
    try {
      const result = await analyzeText({
        text,
        snapshots,
        mode,
        sources,
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
  }, [text, snapshots, mode, sources, createSnapshot])

  // Handle selection analyze
  const handleAnalyzeSelection = useCallback(async (selectionText: string) => {
    if (!selectionText.trim()) return
    
    setIsAnalyzing(true)
    setError(null)
    
    try {
      const result = await analyzeText({
        text,
        snapshots: [],
        mode,
        sources,
        scope: {
          type: 'selection',
          selection_text: selectionText,
        },
      })
      setAnalysisResult(result)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to analyze selection'
      setError(message)
      console.error('Analysis error:', err)
    } finally {
      setIsAnalyzing(false)
    }
  }, [text, mode, sources])

  // Handle observation click - scroll to and highlight paragraph
  const handleObservationClick = useCallback((paragraphIndex: number) => {
    setHighlightedParagraph(paragraphIndex)
    
    // Clear highlight after 3 seconds
    setTimeout(() => {
      setHighlightedParagraph(null)
    }, 3000)
  }, [])

  // Count paragraphs
  const paragraphCount = text.split(/\n\s*\n/).filter((p) => p.trim()).length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">Fermatter</h1>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                Structured writing feedback
              </span>
            </div>
            <div className="flex items-center gap-4">
              <ModeSelector mode={mode} onModeChange={setMode} />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-1"
              >
                <Settings2 className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
                {showSettings ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
          
          {/* Collapsible settings panel */}
          {showSettings && (
            <div className="mt-4 pt-4 border-t">
              <div className="max-w-md">
                <SourcesPanel sources={sources} onSourcesChange={setSources} />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="bg-destructive/10 border-b border-destructive/20">
          <div className="container mx-auto px-4 py-2">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-180px)]">
          {/* Left: Editor (7 columns) */}
          <div className="lg:col-span-7 flex flex-col">
            <Editor
              text={text}
              onTextChange={setText}
              onAnalyze={handleAnalyze}
              onAnalyzeSelection={handleAnalyzeSelection}
              isAnalyzing={isAnalyzing}
              snapshotCount={snapshots.length}
              highlightedParagraph={highlightedParagraph}
            />
          </div>

          {/* Right: Feedback Panel + Instability Map (5 columns) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Instability Map */}
            {(analysisResult?.unstable.length ?? 0) > 0 || paragraphCount > 0 ? (
              <InstabilityMap
                unstable={analysisResult?.unstable || []}
                paragraphCount={analysisResult?.meta?.paragraph_count || paragraphCount}
                onParagraphClick={handleObservationClick}
              />
            ) : null}

            {/* Feedback Panel */}
            <div className="flex-1 min-h-0">
              <FeedbackPanel
                observations={analysisResult?.observations || []}
                sourcesUsed={analysisResult?.sources_used || []}
                meta={analysisResult?.meta || null}
                onObservationClick={handleObservationClick}
                isLoading={isAnalyzing}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
