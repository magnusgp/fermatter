import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { X, Check, Eye, EyeOff } from 'lucide-react'

export function BlackBoxVsRailsViz() {
  return (
    <div className="grid md:grid-cols-2 gap-6 w-full max-w-3xl mx-auto">
      {/* Black Box - Left */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <Card className="p-6 bg-gray-900 border-gray-700 h-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
              <EyeOff className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <h4 className="font-bold text-white">Opaque AI</h4>
              <p className="text-xs text-gray-500">Traditional tools</p>
            </div>
          </div>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <X className="w-4 h-4 text-red-400" />
              <span>Rewrites your words</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <X className="w-4 h-4 text-red-400" />
              <span>No explanation why</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <X className="w-4 h-4 text-red-400" />
              <span>Can't audit changes</span>
            </div>
          </div>

          {/* Visual: opaque box */}
          <div className="mt-6">
            <div className="w-full h-16 bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700">
              <span className="text-gray-600 text-xs font-mono">??? → ???</span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Transparent Rails - Right */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="p-6 bg-blue-50 border-blue-200 h-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-bold text-blue-900">Transparent Rails</h4>
              <p className="text-xs text-blue-600">Fermatter approach</p>
            </div>
          </div>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-blue-800">
              <Check className="w-4 h-4 text-green-500" />
              <span>Questions, not rewrites</span>
            </div>
            <div className="flex items-center gap-2 text-blue-800">
              <Check className="w-4 h-4 text-green-500" />
              <span>Anchored to exact text</span>
            </div>
            <div className="flex items-center gap-2 text-blue-800">
              <Check className="w-4 h-4 text-green-500" />
              <span>Full audit trail</span>
            </div>
          </div>

          {/* Visual: transparent pipeline */}
          <div className="mt-6 flex items-center justify-between gap-2">
            {['Write', 'Analyze', 'Feedback', 'Decide'].map((step, i) => (
              <motion.div
                key={step}
                className="flex-1"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 + i * 0.1 }}
              >
                <div className="h-8 bg-blue-100 rounded flex items-center justify-center text-[10px] font-medium text-blue-700 border border-blue-200">
                  {step}
                </div>
                {i < 3 && (
                  <div className="h-0.5 bg-blue-300 w-full mt-[-16px] -z-10" />
                )}
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
