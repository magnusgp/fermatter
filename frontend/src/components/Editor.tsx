import { useCallback, useRef, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Send, Clock, MousePointer2 } from 'lucide-react'

interface EditorProps {
  text: string
  onTextChange: (text: string) => void
  onAnalyze: () => void
  onAnalyzeSelection?: (selectionText: string) => void
  isAnalyzing: boolean
  snapshotCount: number
  highlightedParagraph: number | null
}

/**
 * Text editor component with paragraph numbers and selection analysis.
 * Handles text input and triggers analysis.
 */
export function Editor({
  text,
  onTextChange,
  onAnalyze,
  onAnalyzeSelection,
  isAnalyzing,
  snapshotCount,
  highlightedParagraph,
}: EditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [selection, setSelection] = useState<string | null>(null)
  const [selectionPosition, setSelectionPosition] = useState<{ top: number; left: number } | null>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.max(400, textareaRef.current.scrollHeight)}px`
    }
  }, [text])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onTextChange(e.target.value)
    },
    [onTextChange]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Ctrl/Cmd + Enter to analyze
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        onAnalyze()
      }
    },
    [onAnalyze]
  )

  // Handle text selection
  const handleSelect = useCallback(() => {
    if (!textareaRef.current) return

    const selectedText = textareaRef.current.value.substring(
      textareaRef.current.selectionStart,
      textareaRef.current.selectionEnd
    )

    if (selectedText && selectedText.trim().length > 10) {
      setSelection(selectedText)
      // Position the button near the selection (simplified positioning)
      const rect = textareaRef.current.getBoundingClientRect()
      setSelectionPosition({
        top: rect.top + 60, // Below the header
        left: rect.left + rect.width / 2,
      })
    } else {
      setSelection(null)
      setSelectionPosition(null)
    }
  }, [])

  // Clear selection when clicking elsewhere
  const handleBlur = useCallback(() => {
    // Delay to allow button click to register
    setTimeout(() => {
      setSelection(null)
      setSelectionPosition(null)
    }, 200)
  }, [])

  // Handle analyze selection
  const handleAnalyzeSelection = useCallback(() => {
    if (selection && onAnalyzeSelection) {
      onAnalyzeSelection(selection)
      setSelection(null)
      setSelectionPosition(null)
    }
  }, [selection, onAnalyzeSelection])

  // Compute paragraphs for visual display
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim())

  return (
    <Card className="h-full flex flex-col relative">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Editor</CardTitle>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{snapshotCount} snapshots</span>
          </div>
          <Button
            onClick={onAnalyze}
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
      </CardHeader>
      <CardContent className="flex-1 flex flex-col relative">
        {/* Paragraph indicators on the left */}
        <div className="absolute left-0 top-0 w-8 flex flex-col gap-2 pt-2 text-xs text-muted-foreground font-mono">
          {paragraphs.map((_, idx) => (
            <div
              key={idx}
              className={`h-6 flex items-center justify-center rounded transition-colors ${
                highlightedParagraph === idx
                  ? 'bg-yellow-200 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                  : ''
              }`}
            >
              {idx + 1}
            </div>
          ))}
        </div>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onSelect={handleSelect}
          onBlur={handleBlur}
          placeholder="Start writing here...

Separate paragraphs with blank lines. The analyzer will give you feedback on structure, clarity, and evidence.

Press Ctrl+Enter (or Cmd+Enter) to analyze the full document.
Select text to analyze just that portion."
          className="flex-1 min-h-[400px] w-full resize-none rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono leading-relaxed"
        />

        {/* Selection analyze button */}
        {selection && selectionPosition && onAnalyzeSelection && (
          <div
            className="fixed z-50 animate-in fade-in-0 zoom-in-95"
            style={{
              top: selectionPosition.top,
              left: selectionPosition.left,
              transform: 'translateX(-50%)',
            }}
          >
            <Button
              size="sm"
              variant="secondary"
              onClick={handleAnalyzeSelection}
              disabled={isAnalyzing}
              className="shadow-lg"
            >
              <MousePointer2 className="h-4 w-4 mr-2" />
              Analyze Selection
            </Button>
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-2">
          Tip: Separate paragraphs with blank lines. Press Ctrl+Enter to analyze.
          {onAnalyzeSelection && ' Select text to analyze just that portion.'}
        </p>
      </CardContent>
    </Card>
  )
}
