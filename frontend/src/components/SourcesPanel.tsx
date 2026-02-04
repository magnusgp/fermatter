import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { LibrarySource, SourcesInput } from '@/lib/types'
import { getSources } from '@/lib/api'
import { BookOpen, Link, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SourcesPanelProps {
  sources: SourcesInput
  onSourcesChange: (sources: SourcesInput) => void
}

export function SourcesPanel({ sources, onSourcesChange }: SourcesPanelProps) {
  const [librarySources, setLibrarySources] = useState<LibrarySource[]>([])
  const [userSourcesText, setUserSourcesText] = useState(sources.user.join('\n'))
  const [loading, setLoading] = useState(true)

  // Fetch library sources on mount
  useEffect(() => {
    getSources()
      .then((res) => setLibrarySources(res.sources))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Toggle a library source
  const toggleLibrarySource = (id: string) => {
    const newIds = sources.library_ids.includes(id)
      ? sources.library_ids.filter((sid) => sid !== id)
      : [...sources.library_ids, id]
    onSourcesChange({ ...sources, library_ids: newIds })
  }

  // Update user sources when text changes
  const handleUserSourcesChange = (text: string) => {
    setUserSourcesText(text)
    const userList = text
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
    onSourcesChange({ ...sources, user: userList })
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Sources
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Library sources */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">
            Reference Library
          </label>
          {loading ? (
            <div className="text-xs text-muted-foreground">Loading...</div>
          ) : (
            <ScrollArea className="h-32">
              <div className="space-y-1">
                {librarySources.map((source) => {
                  const isSelected = sources.library_ids.includes(source.id)
                  return (
                    <button
                      key={source.id}
                      onClick={() => toggleLibrarySource(source.id)}
                      className={cn(
                        'w-full text-left p-2 rounded-md text-xs transition-colors',
                        'border hover:bg-muted/50',
                        isSelected ? 'bg-muted border-primary' : 'bg-background border-input'
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5">
                          {isSelected ? (
                            <CheckCircle2 className="h-3 w-3 text-primary" />
                          ) : (
                            <div className="h-3 w-3 rounded-full border border-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-[10px] px-1 py-0">
                              {source.id}
                            </Badge>
                            <span className="font-medium truncate">{source.title}</span>
                          </div>
                          <p className="text-muted-foreground line-clamp-2 mt-0.5">
                            {source.snippet}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* User sources */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
            <Link className="h-3 w-3" />
            Your Sources (one per line)
          </label>
          <textarea
            value={userSourcesText}
            onChange={(e) => handleUserSourcesChange(e.target.value)}
            placeholder="https://example.com/paper&#10;Author, Title (2024)"
            className="w-full h-20 rounded-md border border-input bg-background px-2 py-1.5 text-xs resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        {/* Selected count */}
        <div className="text-xs text-muted-foreground">
          {sources.library_ids.length + sources.user.length} source(s) selected
        </div>
      </CardContent>
    </Card>
  )
}
