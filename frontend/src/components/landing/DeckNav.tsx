import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface DeckNavProps {
  sections: string[]
  activeIndex: number
  onNavigate: (index: number) => void
  className?: string
}

export function DeckNav({ sections, activeIndex, onNavigate, className }: DeckNavProps) {
  return (
    <nav
      className={cn(
        'fixed left-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-3',
        className
      )}
    >
      {sections.map((section, i) => (
        <button
          key={section}
          onClick={() => onNavigate(i)}
          className="group flex items-center gap-3"
          aria-label={`Go to ${section}`}
        >
          <motion.div
            className={cn(
              'w-3 h-3 rounded-full border-2 transition-all duration-300',
              activeIndex === i
                ? 'bg-blue-500 border-blue-500 scale-125'
                : 'border-gray-400 group-hover:border-blue-400'
            )}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          />
          <span
            className={cn(
              'text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap',
              activeIndex === i ? 'text-blue-500' : 'text-gray-500'
            )}
          >
            {section}
          </span>
        </button>
      ))}
    </nav>
  )
}

// Progress bar alternative
export function DeckProgress({ current, total }: { current: number; total: number }) {
  const progress = ((current + 1) / total) * 100

  return (
    <div className="fixed bottom-0 left-0 right-0 h-1 bg-gray-200 z-50">
      <motion.div
        className="h-full bg-blue-500"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.3 }}
      />
    </div>
  )
}
