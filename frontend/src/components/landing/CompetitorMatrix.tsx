import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'

interface Competitor {
  name: string
  x: number // 0-100 (control)
  y: number // 0-100 (transparency)
  color: string
}

const competitors: Competitor[] = [
  { name: 'Grammarly', x: 35, y: 30, color: 'bg-gray-400' },
  { name: 'ChatGPT', x: 18, y: 12, color: 'bg-gray-400' },
  { name: 'Notion AI', x: 42, y: 38, color: 'bg-gray-400' },
  { name: 'Jasper', x: 28, y: 18, color: 'bg-gray-400' },
  { name: 'Fermatter', x: 75, y: 75, color: 'bg-blue-500' },
]

export function CompetitorMatrix() {
  return (
    <Card className="p-6 bg-white shadow-xl border-0 w-full max-w-lg mx-auto">
      <div className="relative w-full aspect-square">
        {/* Grid lines */}
        <div className="absolute inset-0">
          {/* Horizontal lines */}
          {[25, 50, 75].map((y) => (
            <div
              key={y}
              className="absolute w-full h-px bg-gray-100"
              style={{ top: `${100 - y}%` }}
            />
          ))}
          {/* Vertical lines */}
          {[25, 50, 75].map((x) => (
            <div
              key={x}
              className="absolute h-full w-px bg-gray-100"
              style={{ left: `${x}%` }}
            />
          ))}
        </div>

        {/* Quadrant labels */}
        <div className="absolute top-2 left-2 text-[10px] text-gray-400 font-medium">
          Low Control
          <br />
          High Transparency
        </div>
        <div className="absolute top-2 right-2 text-[10px] text-gray-400 font-medium text-right">
          High Control
          <br />
          High Transparency
        </div>
        <div className="absolute bottom-2 left-2 text-[10px] text-gray-400 font-medium">
          Low Control
          <br />
          Low Transparency
        </div>
        <div className="absolute bottom-2 right-2 text-[10px] text-gray-400 font-medium text-right">
          High Control
          <br />
          Low Transparency
        </div>

        {/* Ideal zone highlight */}
        <motion.div
          className="absolute top-0 right-0 w-1/2 h-1/2 bg-blue-50 rounded-tl-3xl"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.5 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        />

        {/* Competitors */}
        {competitors.map((comp, i) => (
          <motion.div
            key={comp.name}
            className="absolute flex flex-col items-center"
            style={{
              left: `${comp.x}%`,
              bottom: `${comp.y}%`,
              transform: 'translate(-50%, 50%)',
            }}
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 + i * 0.1 }}
          >
            <div
              className={`w-4 h-4 rounded-full ${comp.color} ${
                comp.name === 'Fermatter' ? 'ring-4 ring-blue-200' : ''
              }`}
            />
            <span
              className={`text-[10px] mt-1 font-medium whitespace-nowrap ${
                comp.name === 'Fermatter' ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              {comp.name}
            </span>
          </motion.div>
        ))}

        {/* Axes */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-300" />
        <div className="absolute top-0 bottom-0 left-0 w-px bg-gray-300" />

        {/* Axis labels */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-gray-500 font-medium">
          User Control →
        </div>
        <div className="absolute -left-6 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-gray-500 font-medium whitespace-nowrap">
          Transparency →
        </div>
      </div>
    </Card>
  )
}
