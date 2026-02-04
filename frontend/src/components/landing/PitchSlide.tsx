import { ReactNode, forwardRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface PitchSlideProps {
  id: string
  className?: string
  children: ReactNode
  variant?: 'default' | 'dark' | 'gradient'
}

export const PitchSlide = forwardRef<HTMLElement, PitchSlideProps>(
  ({ id, className, children, variant = 'default' }, ref) => {
    const variants = {
      default: 'bg-background',
      dark: 'bg-slate-900 text-white',
      gradient: 'bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white',
    }

    return (
      <section
        ref={ref}
        id={id}
        className={cn(
          'min-h-screen w-full snap-start snap-always flex items-center justify-center relative overflow-hidden',
          variants[variant],
          className
        )}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="container mx-auto px-6 py-16 md:py-24"
        >
          {children}
        </motion.div>
      </section>
    )
  }
)

PitchSlide.displayName = 'PitchSlide'

// Slide content components
export function SlideHeadline({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={cn('text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6', className)}>
      {children}
    </h2>
  )
}

export function SlideSubheadline({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('text-xl md:text-2xl text-muted-foreground mb-8', className)}>
      {children}
    </p>
  )
}

export function SlideBullets({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={cn('space-y-3', className)}>
      {items.map((item, i) => (
        <motion.li
          key={i}
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 + i * 0.1 }}
          className="flex items-start gap-3 text-lg md:text-xl"
        >
          <span className="w-2 h-2 rounded-full bg-blue-500 mt-2.5 shrink-0" />
          <span>{item}</span>
        </motion.li>
      ))}
    </ul>
  )
}

export function SlideGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('grid md:grid-cols-2 gap-12 lg:gap-20 items-center', className)}>
      {children}
    </div>
  )
}
