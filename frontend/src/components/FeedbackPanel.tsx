import { useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import type { Observation, SourceUsed, Meta } from '@/lib/types'
import {
  AlertTriangle,
  FileQuestion,
  RefreshCw,
  Target,
  Quote,
  ExternalLink,
  ChevronDown,
  Zap,
  Info,
  AlertCircle,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FeedbackPanelProps {
  observations: Observation[]
  sourcesUsed: SourceUsed[]
  meta: Meta | null
  expandedId: string | null
  onExpandChange: (id: string | null) => void
  activeId: string | null
  onActiveChange: (observation: Observation | null) => void
  onHover: (observation: Observation | null) => void
  feedbackRefs: React.MutableRefObject<Map<string, HTMLDivElement>>
  isLoading?: boolean
}

// Type-based styling matching the demo exactly
const typeColors: Record<
  Observation['type'],
  string
> = {
  unclear_claim: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
  missing_evidence: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
  tone: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
  logic_gap: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
  structure: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
  instability: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800',
  precision: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800',
  citation_needed: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
}

const severityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  medium: 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400',
  high: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400',
}

const typeIcons: Record<Observation['type'], React.ReactNode> = {
  unclear_claim: <Info className="h-4 w-4" />,
  missing_evidence: <FileQuestion className="h-4 w-4" />,
  tone: <AlertCircle className="h-4 w-4" />,
  logic_gap: <AlertTriangle className="h-4 w-4" />,
  structure: <FileText className="h-4 w-4" />,
  instability: <RefreshCw className="h-4 w-4" />,
  precision: <Target className="h-4 w-4" />,
  citation_needed: <Quote className="h-4 w-4" />,
}

function getSeverityLabel(severity: number): string {
  if (severity <= 2) return 'low'
  if (severity <= 3) return 'medium'
  return 'high'
}

/**
 * Feedback card matching the demo FeedbackNoteComponent exactly
 */
function FeedbackCard({
  obs,
  isExpanded,
  isHovered,
  onToggle,
  onHover,
  onClick,
  sourcesMap,
  registerRef,
}: {
  obs: Observation
  isExpanded: boolean
  isHovered: boolean
  onToggle: () => void
  onHover: (hover: boolean) => void
  onClick: () => void
  sourcesMap: Map<string, SourceUsed>
  registerRef: (id: string, el: HTMLDivElement | null) => void
}) {
  const severityLabel = getSeverityLabel(obs.severity)
  const Icon = typeIcons[obs.type] || <Info className="h-4 w-4" />

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      ref={(el) => registerRef(obs.id, el)}
      className={cn(
        'mb-3 rounded-lg border bg-background p-3 shadow-sm transition-all cursor-pointer',
        isHovered && 'shadow-md ring-2 ring-blue-400/50'
      )}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onClick={onClick}
    >
      <div
        className="flex items-start justify-between gap-2"
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
      >
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <span className="mt-0.5 shrink-0 text-muted-foreground">{Icon}</span>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-foreground mb-1">{obs.title}</h4>
            <p className="text-xs text-muted-foreground">{obs.question}</p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0"
        >
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </motion.div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t space-y-2">
              {obs.anchor_text && (
                <div className="bg-muted/50 rounded p-2">
                  <p className="text-xs text-muted-foreground mb-1">Anchor quote:</p>
                  <p className="text-xs font-medium text-foreground">"{obs.anchor_text}"</p>
                </div>
              )}
              <p className="text-xs text-foreground leading-relaxed">{obs.note}</p>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline" className={cn('text-xs', typeColors[obs.type])}>
                  {obs.type.replace('_', ' ')}
                </Badge>
                <Badge variant="outline" className={cn('text-xs', severityColors[severityLabel])}>
                  {severityLabel}
                </Badge>
              </div>
              {/* Source badges */}
              {obs.source_ids.length > 0 && (
                <div className="flex gap-1 flex-wrap pt-1">
                  {obs.source_ids.map((sid) => {
                    const source = sourcesMap.get(sid)
                    return (
                      <a
                        key={sid}
                        href={source?.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-background/80 border rounded text-[10px] font-medium hover:bg-muted transition-colors"
                      >
                        [{sid}]
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/**
 * Narrow margin panel displaying feedback cards matching the demo exactly.
 */
export function FeedbackPanel({
  observations,
  sourcesUsed,
  meta,
  expandedId,
  onExpandChange,
  activeId,
  onActiveChange,
  onHover,
  feedbackRefs,
  isLoading = false,
}: FeedbackPanelProps) {
  const sortedObservations = useMemo(() => {
    return [...observations].sort((a, b) => {
      if (a.paragraph !== b.paragraph) return a.paragraph - b.paragraph
      return b.severity - a.severity
    })
  }, [observations])

  const sourcesMap = useMemo(() => {
    return new Map(sourcesUsed.map((s) => [s.id, s]))
  }, [sourcesUsed])

  const registerRef = useCallback(
    (id: string, el: HTMLDivElement | null) => {
      if (el) {
        feedbackRefs.current.set(id, el)
      } else {
        feedbackRefs.current.delete(id)
      }
    },
    [feedbackRefs]
  )

  const handleToggle = useCallback(
    (id: string) => {
      onExpandChange(expandedId === id ? null : id)
    },
    [expandedId, onExpandChange]
  )

  const handleClick = useCallback(
    (obs: Observation) => {
      onActiveChange(obs)
    },
    [onActiveChange]
  )

  const hasContent = observations.length > 0

  return (
    <div className="bg-card rounded-lg border p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <AlertCircle className="h-4 w-4" />
        Feedback Notes
        {meta?.used_llm && (
          <span className="ml-auto flex items-center gap-0.5 text-yellow-600 dark:text-yellow-400 text-xs">
            <Zap className="h-3 w-3" />
            AI
          </span>
        )}
      </h3>

      <div className="space-y-2">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-lg border p-3 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-full" />
              </div>
            ))}
          </div>
        ) : !hasContent ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            <Info className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p>No feedback yet.</p>
            <p className="mt-1 opacity-70 text-xs">
              Write and analyze to get suggestions.
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {sortedObservations.map((obs) => (
              <FeedbackCard
                key={obs.id}
                obs={obs}
                isExpanded={expandedId === obs.id}
                isHovered={activeId === obs.id}
                onToggle={() => handleToggle(obs.id)}
                onHover={(hover) => onHover(hover ? obs : null)}
                onClick={() => handleClick(obs)}
                sourcesMap={sourcesMap}
                registerRef={registerRef}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
