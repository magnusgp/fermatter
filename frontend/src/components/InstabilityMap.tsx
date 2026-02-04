import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { UnstableParagraph } from '@/lib/types'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InstabilityMapProps {
  unstable: UnstableParagraph[]
  paragraphCount: number
  onParagraphClick: (paragraphIndex: number) => void
}

export function InstabilityMap({
  unstable,
  paragraphCount,
  onParagraphClick,
}: InstabilityMapProps) {
  // Create a map of paragraph -> rewrite count
  const rewriteCounts = useMemo(() => {
    const counts = new Map<number, number>()
    unstable.forEach((u) => counts.set(u.paragraph, u.rewrite_count))
    return counts
  }, [unstable])

  // Find max count for normalization
  const maxCount = useMemo(() => {
    return Math.max(1, ...unstable.map((u) => u.rewrite_count))
  }, [unstable])

  // Sort unstable paragraphs by rewrite count (descending)
  const sortedUnstable = useMemo(() => {
    return [...unstable].sort((a, b) => b.rewrite_count - a.rewrite_count)
  }, [unstable])

  if (paragraphCount === 0) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Instability Map
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Visual bar representation */}
        <div className="flex gap-1 flex-wrap">
          {Array.from({ length: paragraphCount }, (_, i) => {
            const count = rewriteCounts.get(i) || 0
            const intensity = count / maxCount
            const isUnstable = count >= 2
            
            return (
              <button
                key={i}
                onClick={() => onParagraphClick(i)}
                className={cn(
                  'w-6 h-8 rounded text-[10px] font-medium transition-all',
                  'border hover:ring-2 hover:ring-ring',
                  isUnstable
                    ? 'border-orange-300 dark:border-orange-700'
                    : 'border-muted'
                )}
                style={{
                  backgroundColor: isUnstable
                    ? `rgba(251, 146, 60, ${0.2 + intensity * 0.6})`
                    : 'transparent',
                }}
                title={`¶${i + 1}: ${count} rewrites`}
              >
                {i + 1}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded border border-muted" />
            <span>Stable</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-orange-200 border border-orange-300" />
            <span>Unstable</span>
          </div>
        </div>

        {/* Top unstable list */}
        {sortedUnstable.length > 0 && (
          <div className="pt-2 border-t">
            <div className="text-xs font-medium mb-2">Most Rewritten</div>
            <div className="space-y-1">
              {sortedUnstable.slice(0, 3).map((u) => (
                <button
                  key={u.paragraph}
                  onClick={() => onParagraphClick(u.paragraph)}
                  className="w-full flex items-center justify-between p-2 text-xs rounded hover:bg-muted transition-colors"
                >
                  <span className="text-muted-foreground">¶{u.paragraph + 1}</span>
                  <span className="font-medium">{u.rewrite_count} rewrites</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
