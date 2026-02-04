import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Observation, UnstableParagraph, Meta } from '@/lib/types'
import {
  AlertTriangle,
  HelpCircle,
  FileQuestion,
  Layers,
  RefreshCw,
  MessageSquare,
} from 'lucide-react'

interface FeedbackPanelProps {
  observations: Observation[]
  unstable: UnstableParagraph[]
  meta: Meta | null
  onObservationClick: (paragraphIndex: number) => void
}

const typeIcons: Record<Observation['type'], React.ReactNode> = {
  missing_evidence: <FileQuestion className="h-4 w-4" />,
  unclear_claim: <HelpCircle className="h-4 w-4" />,
  logic_gap: <AlertTriangle className="h-4 w-4" />,
  structure: <Layers className="h-4 w-4" />,
  instability: <RefreshCw className="h-4 w-4" />,
}

const typeLabels: Record<Observation['type'], string> = {
  missing_evidence: 'Missing Evidence',
  unclear_claim: 'Unclear Claim',
  logic_gap: 'Logic Gap',
  structure: 'Structure',
  instability: 'Instability',
}

const severityVariants: Record<number, 'secondary' | 'warning' | 'destructive'> = {
  1: 'secondary',
  2: 'warning',
  3: 'destructive',
}

/**
 * Panel displaying analysis feedback and observations.
 */
export function FeedbackPanel({
  observations,
  unstable,
  meta,
  onObservationClick,
}: FeedbackPanelProps) {
  const sortedObservations = useMemo(() => {
    return [...observations].sort((a, b) => {
      // Sort by severity (high to low), then by paragraph
      if (b.severity !== a.severity) return b.severity - a.severity
      return a.paragraph - b.paragraph
    })
  }, [observations])

  const hasContent = observations.length > 0 || unstable.length > 0

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Feedback</CardTitle>
          {meta && (
            <span className="text-sm text-muted-foreground">
              {meta.paragraph_count} paragraph{meta.paragraph_count !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        {!hasContent ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-sm text-center">
              Write some text and click "Analyze" to get feedback.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-full pr-4">
            <div className="space-y-3">
              {sortedObservations.map((observation) => (
                <div
                  key={observation.id}
                  className="p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => onObservationClick(observation.paragraph)}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <span className="mt-0.5 text-muted-foreground">
                      {typeIcons[observation.type]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">
                          {observation.title}
                        </span>
                        <Badge
                          variant={severityVariants[observation.severity] || 'secondary'}
                          className="text-xs"
                        >
                          {typeLabels[observation.type]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          ¶{observation.paragraph + 1}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {observation.note}
                      </p>
                      <p className="text-sm text-primary mt-2 italic">
                        "{observation.question}"
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {unstable.length > 0 && (
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Unstable Paragraphs
                  </h4>
                  <div className="space-y-2">
                    {unstable.map((item) => (
                      <div
                        key={item.paragraph}
                        className="p-2 rounded border bg-muted/30 text-sm cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => onObservationClick(item.paragraph)}
                      >
                        <span className="text-muted-foreground">¶{item.paragraph + 1}:</span>{' '}
                        {item.note}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
