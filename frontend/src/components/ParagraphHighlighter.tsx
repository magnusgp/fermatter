import { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface ParagraphHighlighterProps {
  text: string
  highlightedParagraph: number | null
  onParagraphClick?: (index: number) => void
}

/**
 * Displays text with paragraph numbers and highlighting.
 * Used for showing which paragraph an observation refers to.
 */
export function ParagraphHighlighter({
  text,
  highlightedParagraph,
  onParagraphClick,
}: ParagraphHighlighterProps) {
  const paragraphs = useMemo(() => {
    if (!text.trim()) return []
    return text.split(/\n\s*\n/).filter((p) => p.trim())
  }, [text])

  if (paragraphs.length === 0) {
    return (
      <div className="text-muted-foreground italic p-4">
        No paragraphs to display
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {paragraphs.map((paragraph, index) => (
        <div
          key={index}
          className={cn(
            'flex gap-3 p-2 rounded-md transition-colors cursor-pointer hover:bg-muted/50',
            highlightedParagraph === index && 'paragraph-highlight'
          )}
          onClick={() => onParagraphClick?.(index)}
          id={`paragraph-${index}`}
        >
          <span className="text-muted-foreground text-sm font-mono w-6 flex-shrink-0 text-right">
            {index + 1}
          </span>
          <p className="text-sm whitespace-pre-wrap">{paragraph.trim()}</p>
        </div>
      ))}
    </div>
  )
}
