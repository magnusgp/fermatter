import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Observation, SourceUsed, Meta } from '@/lib/types'
import {
  AlertTriangle,
  HelpCircle,
  FileQuestion,
  Layers,
  RefreshCw,
  MessageSquare,
  Megaphone,
  Target,
  Quote,
  ExternalLink,
  Zap,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FeedbackPanelProps {
  observations: Observation[]
  sourcesUsed: SourceUsed[]
  meta: Meta | null
  onObservationClick: (paragraphIndex: number) => void
  isLoading?: boolean
}

const typeIcons: Record<Observation['type'], React.ReactNode> = {
  missing_evidence: <FileQuestion className="h-4 w-4" />,
  unclear_claim: <HelpCircle className="h-4 w-4" />,
  logic_gap: <AlertTriangle className="h-4 w-4" />,
  structure: <Layers className="h-4 w-4" />,
  instability: <RefreshCw className="h-4 w-4" />,
  tone: <Megaphone className="h-4 w-4" />,
  precision: <Target className="h-4 w-4" />,
  citation_needed: <Quote className="h-4 w-4" />,
}

const typeLabels: Record<Observation['type'], string> = {
  missing_evidence: 'Evidence',
  unclear_claim: 'Clarity',
  logic_gap: 'Logic',
  structure: 'Structure',
  instability: 'Instability',
  tone: 'Tone',
  precision: 'Precision',
  citation_needed: 'Citation',
}

const severityColors: Record<number, string> = {
  1: 'bg-slate-100 text-slate-700 border-slate-200',
  2: 'bg-blue-50 text-blue-700 border-blue-200',
  3: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  4: 'bg-orange-50 text-orange-700 border-orange-200',
  5: 'bg-red-50 text-red-700 border-red-200',
}

/**
 * Panel displaying analysis feedback as margin-style comments.
 */
export function FeedbackPanel({
  observations,
  sourcesUsed,
  meta,
  onObservationClick,
  isLoading = false,
}: FeedbackPanelProps) {
  const sortedObservations = useMemo(() => {
    return [...observations].sort((a, b) => {
      // Sort by paragraph first, then by severity
      if (a.paragraph !== b.paragraph) return a.paragraph - b.paragraph
      return b.severity - a.severity
    })
  }, [observations])

  // Create a map of source id to source details
  const sourcesMap = useMemo(() => {
    return new Map(sourcesUsed.map((s) => [s.id, s]))
  }, [sourcesUsed])

  const hasContent = observations.length > 0

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Feedback
          </CardTitle>
          {meta && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {meta.used_llm && (
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-yellow-500" />
                  AI
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {meta.latency_ms}ms
              </span>
              <span>{meta.paragraph_count}¶</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
            <div className="animate-pulse space-y-3 w-full">
              <div className="h-20 bg-muted rounded-lg" />
              <div className="h-16 bg-muted rounded-lg" />
              <div className="h-24 bg-muted rounded-lg" />
            </div>
          </div>
        ) : !hasContent ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
            <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-sm text-center">
              Write some text and click "Analyze" to get feedback.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              {sortedObservations.map((observation) => (
                <div
                  key={observation.id}
                  className={cn(
                    'p-3 rounded-lg border cursor-pointer transition-all',
                    'hover:shadow-md hover:border-primary/50',
                    severityColors[observation.severity] || severityColors[2]
                  )}
                  onClick={() => onObservationClick(observation.paragraph)}
                >
                  {/* Header with type icon and paragraph indicator */}
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 opacity-70">
                      {typeIcons[observation.type]}
                    </span>
                    <div className="flex-1 min-w-0">
                      {/* Title and badges */}
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-sm">
                          {observation.title}
                        </span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {typeLabels[observation.type]}
                        </Badge>
                        <span className="text-xs opacity-60 font-mono">
                          ¶{observation.paragraph + 1}
                        </span>
                      </div>

                      {/* Anchor text quote */}
                      {observation.anchor_text && (
                        <div className="text-xs italic opacity-70 border-l-2 border-current/30 pl-2 mb-2">
                          "{observation.anchor_text}"
                        </div>
                      )}

                      {/* Note */}
                      <p className="text-sm opacity-90">
                        {observation.note}
                      </p>

                      {/* Question */}
                      <p className="text-sm font-medium mt-2 opacity-80">
                        → {observation.question}
                      </p>

                      {/* Source badges */}
                      {observation.source_ids.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {observation.source_ids.map((sid) => {
                            const source = sourcesMap.get(sid)
                            return (
                              <a
                                key={sid}
                                href={source?.url || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-background/50 rounded text-[10px] font-medium hover:bg-background transition-colors"
                              >
                                [{sid}]
                                <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Sources used section */}
              {sourcesUsed.length > 0 && (
                <div className="pt-4 border-t mt-4">
                  <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                    Sources Referenced
                  </h4>
                  <div className="space-y-1">
                    {sourcesUsed.map((source) => (
                      <a
                        key={source.id}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded hover:bg-muted transition-colors text-xs"
                      >
                        <Badge variant="outline" className="text-[10px] px-1">
                          {source.id}
                        </Badge>
                        <span className="flex-1 truncate">{source.title}</span>
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </a>
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
