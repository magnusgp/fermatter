import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { SourcesInput, AnalysisMode } from '@/lib/types'
import { BookOpen, Check, ExternalLink } from 'lucide-react'
import { getSources } from '@/lib/api'
import type { LibrarySource } from '@/lib/types'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentContext: string
  onDocumentContextChange: (context: string) => void
  sources: SourcesInput
  onSourcesChange: (sources: SourcesInput) => void
  mode: AnalysisMode
}

const CONTEXT_STORAGE_KEY = 'fermatter_document_context'

export function SettingsDialog({
  open,
  onOpenChange,
  documentContext,
  onDocumentContextChange,
  sources,
  onSourcesChange,
  mode,
}: SettingsDialogProps) {
  const [librarySources, setLibrarySources] = useState<LibrarySource[]>([])
  const [userSourcesText, setUserSourcesText] = useState(sources.user.join('\n'))

  // Fetch library sources
  useEffect(() => {
    getSources()
      .then((res) => setLibrarySources(res.sources))
      .catch((err) => console.error('Failed to fetch sources:', err))
  }, [])

  // Sync userSourcesText when sources prop changes
  useEffect(() => {
    setUserSourcesText(sources.user.join('\n'))
  }, [sources.user])

  const toggleLibrarySource = (id: string) => {
    const currentIds = sources.library_ids
    if (currentIds.includes(id)) {
      onSourcesChange({
        ...sources,
        library_ids: currentIds.filter((s) => s !== id),
      })
    } else {
      onSourcesChange({
        ...sources,
        library_ids: [...currentIds, id],
      })
    }
  }

  const handleUserSourcesBlur = () => {
    const parsed = userSourcesText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
    onSourcesChange({
      ...sources,
      user: parsed,
    })
  }

  const handleContextChange = (value: string) => {
    onDocumentContextChange(value)
    // Persist to localStorage
    try {
      localStorage.setItem(CONTEXT_STORAGE_KEY, value)
    } catch {
      // Ignore storage errors
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure analysis options and document context.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Document Context */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Document Context</label>
            <p className="text-xs text-muted-foreground">
              Describe what you're writing and for whom. This helps the AI give more relevant feedback.
            </p>
            <textarea
              value={documentContext}
              onChange={(e) => handleContextChange(e.target.value)}
              placeholder="e.g., Master's thesis introduction for technical readers. Aim: formal, precise, evidence-backed."
              className="w-full h-24 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Current mode: <Badge variant="outline" className="ml-1 text-[10px]">{mode}</Badge>
            </p>
          </div>

          {/* Library Sources */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Reference Sources
            </label>
            <p className="text-xs text-muted-foreground">
              Select style guides for the AI to reference.
            </p>
            <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
              {librarySources.map((source) => {
                const isSelected = sources.library_ids.includes(source.id)
                return (
                  <button
                    key={source.id}
                    onClick={() => toggleLibrarySource(source.id)}
                    className={`flex items-center gap-2 p-2 rounded-md border text-left text-xs transition-colors ${
                      isSelected
                        ? 'bg-primary/10 border-primary/30'
                        : 'bg-background hover:bg-muted border-border'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-sm border flex items-center justify-center ${
                        isSelected
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-muted-foreground/30'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    <span className="flex-1 truncate font-medium">{source.title}</span>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </button>
                )
              })}
            </div>
          </div>

          {/* User Sources */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Sources</label>
            <p className="text-xs text-muted-foreground">
              Add URLs or citation strings (one per line).
            </p>
            <textarea
              value={userSourcesText}
              onChange={(e) => setUserSourcesText(e.target.value)}
              onBlur={handleUserSourcesBlur}
              placeholder="https://example.com/style-guide&#10;Smith et al. (2023)"
              className="w-full h-20 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none font-mono text-xs"
            />
          </div>

          {/* API Info */}
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              API: <code className="bg-muted px-1 rounded">localhost:8000</code>
            </p>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Helper to load context from localStorage
export function loadDocumentContext(): string {
  try {
    return localStorage.getItem(CONTEXT_STORAGE_KEY) || ''
  } catch {
    return ''
  }
}
