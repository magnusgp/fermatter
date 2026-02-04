import { useCallback, useRef, useEffect, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Send, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Observation } from '@/lib/types'

interface EditorProps {
  text: string
  onTextChange: (text: string) => void
  onAnalyze: () => void
  isAnalyzing: boolean
  snapshotCount: number
  activeObservation: Observation | null
  hoveredObservation: Observation | null
  paragraphRefs: React.MutableRefObject<Map<number, HTMLDivElement>>
}

/**
 * Split text into paragraphs (separated by blank lines).
 */
export function splitIntoParagraphs(text: string): string[] {
  return text.split(/\n\s*\n/).filter((p) => p.trim())
}

/**
 * Text editor component with paragraph-based rendering for highlight mapping.
 */
export function Editor({
  text,
  onTextChange,
  onAnalyze,
  isAnalyzing,
  snapshotCount,
  activeObservation,
  hoveredObservation,
  paragraphRefs,
}: EditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isEditing] = useState(true)

  // Parse paragraphs for display
  const paragraphs = useMemo(() => splitIntoParagraphs(text), [text])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && isEditing) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.max(300, textareaRef.current.scrollHeight)}px`
    }
  }, [text, isEditing])

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

  // Determine which paragraph should be highlighted
  const highlightedParagraph = activeObservation?.paragraph ?? hoveredObservation?.paragraph ?? null
  const highlightAnchor = activeObservation?.anchor_text || hoveredObservation?.anchor_text || null

  // Register paragraph refs
  const registerParagraphRef = useCallback(
    (index: number, el: HTMLDivElement | null) => {
      if (el) {
        paragraphRefs.current.set(index, el)
      } else {
        paragraphRefs.current.delete(index)
      }
    },
    [paragraphRefs]
  )

  // Highlight anchor text within paragraph
  const renderParagraphWithHighlight = (para: string, isTarget: boolean, anchor: string | null) => {
    if (!isTarget || !anchor) {
      return para
    }

    const lowerPara = para.toLowerCase()
    const lowerAnchor = anchor.toLowerCase()
    const index = lowerPara.indexOf(lowerAnchor)

    if (index === -1) {
      return para
    }

    const before = para.slice(0, index)
    const match = para.slice(index, index + anchor.length)
    const after = para.slice(index + anchor.length)

    return (
      <>
        {before}
        <mark className="bg-yellow-300 dark:bg-yellow-700 px-0.5 rounded">{match}</mark>
        {after}
      </>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b">
        <CardTitle className="text-base font-medium">Document</CardTitle>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{snapshotCount}</span>
          </div>
          <Button
            onClick={onAnalyze}
            disabled={isAnalyzing || !text.trim()}
            size="sm"
            className="h-8"
          >
            {isAnalyzing ? (
              <span className="animate-pulse">Analyzing...</span>
            ) : (
              <>
                <Send className="h-3 w-3 mr-1.5" />
                Analyze
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-auto p-0">
        {isEditing ? (
          <div className="p-4">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Start writing here...

Separate paragraphs with blank lines.
Press Ctrl+Enter (Cmd+Enter) to analyze."
              className="w-full min-h-[300px] resize-none bg-transparent border-0 focus:outline-none focus:ring-0 text-sm leading-relaxed font-serif placeholder:text-muted-foreground/50"
            />
          </div>
        ) : null}

        {/* Paragraph preview with highlights (shown alongside or as overlay) */}
        {!isEditing && paragraphs.length > 0 && (
          <div className="p-4 space-y-4">
            {paragraphs.map((para, idx) => {
              const isHighlighted = highlightedParagraph === idx
              return (
                <div
                  key={idx}
                  ref={(el) => registerParagraphRef(idx, el)}
                  data-paragraph-index={idx}
                  className={cn(
                    'p-3 rounded-lg transition-all duration-200 border border-transparent',
                    isHighlighted && 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800'
                  )}
                >
                  <p className="text-sm leading-relaxed font-serif whitespace-pre-wrap">
                    {renderParagraphWithHighlight(para, isHighlighted, highlightAnchor)}
                  </p>
                </div>
              )
            })}
          </div>
        )}

        {/* Always show paragraph refs for connector positioning */}
        {isEditing && paragraphs.length > 0 && (
          <div className="absolute opacity-0 pointer-events-none" aria-hidden>
            {paragraphs.map((_, idx) => (
              <div
                key={idx}
                ref={(el) => registerParagraphRef(idx, el)}
                data-paragraph-index={idx}
              />
            ))}
          </div>
        )}
      </CardContent>

      <div className="px-4 py-2 border-t text-xs text-muted-foreground">
        {paragraphs.length} paragraph{paragraphs.length !== 1 ? 's' : ''} · Ctrl+Enter to analyze
      </div>
    </Card>
  )
}
