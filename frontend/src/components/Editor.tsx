import { useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Send, Clock } from 'lucide-react'

interface EditorProps {
  text: string
  onTextChange: (text: string) => void
  onAnalyze: () => void
  isAnalyzing: boolean
  snapshotCount: number
}

/**
 * Text editor component with paragraph numbers.
 * Handles text input and triggers analysis.
 */
export function Editor({
  text,
  onTextChange,
  onAnalyze,
  isAnalyzing,
  snapshotCount,
}: EditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
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

  return (
    <Card className="h-full flex flex-col">
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
              <>
                <span className="animate-pulse">Analyzing...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Analyze
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Start writing here...

Separate paragraphs with blank lines. The analyzer will give you feedback on structure, clarity, and evidence.

Press Ctrl+Enter (or Cmd+Enter) to analyze."
          className="flex-1 min-h-[400px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
        />
        <p className="text-xs text-muted-foreground mt-2">
          Tip: Separate paragraphs with blank lines. Press Ctrl+Enter to analyze.
        </p>
      </CardContent>
    </Card>
  )
}
