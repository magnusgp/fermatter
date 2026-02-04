import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'

export function FermatMarginViz() {
  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Paper/Editor card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <Card className="p-6 bg-white shadow-2xl border-0 relative">
          {/* Editor header */}
          <div className="flex items-center gap-2 mb-4 pb-3 border-b">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <span className="ml-2 text-xs text-gray-400 font-mono">untitled.md</span>
          </div>

          {/* Text content */}
          <div className="font-mono text-sm leading-relaxed text-gray-700 space-y-3">
            <p>The hypothesis suggests that quantum</p>
            <p>entanglement enables instantaneous</p>
            <motion.p
              className="relative"
              initial={{ backgroundColor: 'transparent' }}
              whileInView={{ backgroundColor: 'rgba(59, 130, 246, 0.15)' }}
              viewport={{ once: true }}
              transition={{ delay: 0.8, duration: 0.3 }}
            >
              <span className="relative z-10">
                communication across vast distances.
              </span>
              {/* Underline highlight */}
              <motion.span
                className="absolute bottom-0 left-0 h-0.5 bg-blue-500"
                initial={{ width: 0 }}
                whileInView={{ width: '100%' }}
                viewport={{ once: true }}
                transition={{ delay: 1, duration: 0.4 }}
              />
            </motion.p>
            <p className="text-gray-400">...</p>
          </div>
        </Card>
      </motion.div>

      {/* Connector line */}
      <motion.svg
        className="absolute top-1/2 -right-8 md:-right-16 w-16 md:w-24 h-20"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 1.2 }}
      >
        <motion.path
          d="M0 40 Q 30 40, 50 20"
          fill="none"
          stroke="#3B82F6"
          strokeWidth="2"
          strokeDasharray="4 4"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1.3, duration: 0.5 }}
        />
        <motion.circle
          cx="50"
          cy="20"
          r="4"
          fill="#3B82F6"
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1.6 }}
        />
      </motion.svg>

      {/* Margin note */}
      <motion.div
        className="absolute -right-4 md:right-[-180px] top-1/3 w-44 md:w-56"
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 1.4, duration: 0.4 }}
      >
        <Card className="p-3 bg-blue-50 border-blue-200 shadow-lg">
          <div className="flex items-start gap-2">
            <span className="text-blue-500 text-lg">💭</span>
            <div>
              <p className="text-xs font-medium text-blue-800 italic leading-snug">
                "I have discovered a truly remarkable critique of this claim…"
              </p>
              <p className="text-[10px] text-blue-600 mt-2 font-mono">
                — Fermat, probably
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Floating particles */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-blue-400 rounded-full"
          style={{
            left: `${20 + i * 15}%`,
            top: `${10 + i * 10}%`,
          }}
          animate={{
            y: [0, -10, 0],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: 2 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  )
}
