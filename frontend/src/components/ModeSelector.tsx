import { cn } from '@/lib/utils'
import type { AnalysisMode } from '@/lib/types'
import { FlaskConical, Newspaper, Heart } from 'lucide-react'

interface ModeSelectorProps {
  mode: AnalysisMode
  onModeChange: (mode: AnalysisMode) => void
}

const modes: { id: AnalysisMode; label: string; icon: React.ReactNode; description: string }[] = [
  {
    id: 'scientific',
    label: 'Scientific',
    icon: <FlaskConical className="h-4 w-4" />,
    description: 'Rigorous academic feedback',
  },
  {
    id: 'journalist',
    label: 'Journalist',
    icon: <Newspaper className="h-4 w-4" />,
    description: 'Clear, engaging writing',
  },
  {
    id: 'grandma',
    label: 'Email to Grandma',
    icon: <Heart className="h-4 w-4" />,
    description: 'Warm, clear communication',
  },
]

export function ModeSelector({ mode, onModeChange }: ModeSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-foreground">Writing Mode</label>
      <div className="flex gap-2">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => onModeChange(m.id)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              'border hover:bg-muted/50',
              mode === m.id
                ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
                : 'bg-background text-muted-foreground border-input'
            )}
            title={m.description}
          >
            {m.icon}
            <span className="hidden sm:inline">{m.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
