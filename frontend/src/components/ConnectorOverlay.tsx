import { useEffect, useState, useCallback } from 'react'
import type { Observation } from '@/lib/types'

interface ConnectorOverlayProps {
  containerRef: React.RefObject<HTMLDivElement>
  paragraphRefs: React.MutableRefObject<Map<number, HTMLDivElement>>
  feedbackRefs: React.MutableRefObject<Map<string, HTMLDivElement>>
  activeObservation: Observation | null
  hoveredObservation: Observation | null
}

interface ConnectorLine {
  x1: number
  y1: number
  x2: number
  y2: number
  cx1: number
  cy1: number
  cx2: number
  cy2: number
}

/**
 * SVG overlay that draws connector lines between feedback cards and paragraphs.
 */
export function ConnectorOverlay({
  containerRef,
  paragraphRefs,
  feedbackRefs,
  activeObservation,
  hoveredObservation,
}: ConnectorOverlayProps) {
  const [line, setLine] = useState<ConnectorLine | null>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  // Get the observation to draw connector for
  const targetObservation = activeObservation || hoveredObservation

  const computeConnector = useCallback(() => {
    if (!containerRef.current || !targetObservation) {
      setLine(null)
      return
    }

    const containerRect = containerRef.current.getBoundingClientRect()
    setDimensions({
      width: containerRect.width,
      height: containerRect.height,
    })

    // Get paragraph element
    const paragraphEl = paragraphRefs.current.get(targetObservation.paragraph)
    // Get feedback card element
    const feedbackEl = feedbackRefs.current.get(targetObservation.id)

    if (!paragraphEl || !feedbackEl) {
      setLine(null)
      return
    }

    const paraRect = paragraphEl.getBoundingClientRect()
    const feedbackRect = feedbackEl.getBoundingClientRect()

    // Convert to container-relative coordinates
    const paraX = paraRect.right - containerRect.left
    const paraY = paraRect.top + paraRect.height / 2 - containerRect.top
    const feedbackX = feedbackRect.left - containerRect.left
    const feedbackY = feedbackRect.top + feedbackRect.height / 2 - containerRect.top

    // Create bezier curve control points
    const controlOffset = Math.min(40, Math.abs(feedbackX - paraX) / 3)

    setLine({
      x1: paraX + 4, // Start from right edge of paragraph
      y1: paraY,
      x2: feedbackX - 4, // End at left edge of feedback card
      y2: feedbackY,
      cx1: paraX + controlOffset,
      cy1: paraY,
      cx2: feedbackX - controlOffset,
      cy2: feedbackY,
    })
  }, [containerRef, paragraphRefs, feedbackRefs, targetObservation])

  // Recompute on observation change
  useEffect(() => {
    computeConnector()
  }, [computeConnector])

  // Recompute on scroll and resize
  useEffect(() => {
    const handleUpdate = () => {
      requestAnimationFrame(computeConnector)
    }

    window.addEventListener('scroll', handleUpdate, true)
    window.addEventListener('resize', handleUpdate)

    return () => {
      window.removeEventListener('scroll', handleUpdate, true)
      window.removeEventListener('resize', handleUpdate)
    }
  }, [computeConnector])

  if (!line || !targetObservation) {
    return null
  }

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-10"
      width={dimensions.width}
      height={dimensions.height}
      style={{ overflow: 'visible' }}
    >
      {/* Connector path */}
      <path
        d={`M ${line.x1} ${line.y1} C ${line.cx1} ${line.cy1}, ${line.cx2} ${line.cy2}, ${line.x2} ${line.y2}`}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="1.5"
        strokeDasharray="4 2"
        opacity="0.6"
        className="animate-in fade-in-0 duration-200"
      />
      {/* Dot at paragraph end */}
      <circle
        cx={line.x1}
        cy={line.y1}
        r="4"
        fill="hsl(var(--primary))"
        opacity="0.8"
        className="animate-in zoom-in-0 duration-200"
      />
      {/* Small arrow/dot at feedback end */}
      <circle
        cx={line.x2}
        cy={line.y2}
        r="3"
        fill="hsl(var(--primary))"
        opacity="0.6"
        className="animate-in zoom-in-0 duration-200"
      />
    </svg>
  )
}
