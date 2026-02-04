import { useState, useEffect, useCallback, useRef } from 'react'
import { Editor } from '@/components/Editor'
import { FeedbackPanel } from '@/components/FeedbackPanel'
import { ParagraphHighlighter } from '@/components/ParagraphHighlighter'
import { analyzeText } from '@/lib/api'
import type { Snapshot, AnalyzeResponse } from '@/lib/types'
import { FileText } from 'lucide-react'

const MAX_SNAPSHOTS = 20
const SNAPSHOT_INTERVAL_MS = 10000 // 10 seconds

function App() {
  const [text, setText] = useState('')
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [analysisResult, setAnalysisResult] = useState<AnalyzeResponse | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [highlightedParagraph, setHighlightedParagraph] = useState<number | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  
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

  // Handle analyze
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
      })
      setAnalysisResult(result)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to analyze text'
      setError(message)
      console.error('Analysis error:', err)
    } finally {
      setIsAnalyzing(false)
    }
  }, [text, snapshots, createSnapshot])

  // Handle observation click - scroll to and highlight paragraph
  const handleObservationClick = useCallback((paragraphIndex: number) => {
    setHighlightedParagraph(paragraphIndex)
    setShowPreview(true)
    
    // Scroll to paragraph
    setTimeout(() => {
      const element = document.getElementById(`paragraph-${paragraphIndex}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)
    
    // Clear highlight after 3 seconds
    setTimeout(() => {
      setHighlightedParagraph(null)
    }, 3000)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">Fermatter</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </button>
            </div>
          </div>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-180px)]">
          {/* Left: Editor */}
          <div className="flex flex-col">
            <Editor
              text={text}
              onTextChange={setText}
              onAnalyze={handleAnalyze}
              isAnalyzing={isAnalyzing}
              snapshotCount={snapshots.length}
            />
          </div>

          {/* Right: Feedback Panel or Preview */}
          <div className="flex flex-col">
            {showPreview ? (
              <div className="flex flex-col h-full gap-4">
                <div className="flex-1 border rounded-lg p-4 overflow-auto">
                  <h3 className="text-sm font-medium mb-3">Paragraph Preview</h3>
                  <ParagraphHighlighter
                    text={text}
                    highlightedParagraph={highlightedParagraph}
                    onParagraphClick={handleObservationClick}
                  />
                </div>
                <div className="h-1/2">
                  <FeedbackPanel
                    observations={analysisResult?.observations || []}
                    unstable={analysisResult?.unstable || []}
                    meta={analysisResult?.meta || null}
                    onObservationClick={handleObservationClick}
                  />
                </div>
              </div>
            ) : (
              <FeedbackPanel
                observations={analysisResult?.observations || []}
                unstable={analysisResult?.unstable || []}
                meta={analysisResult?.meta || null}
                onObservationClick={handleObservationClick}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
