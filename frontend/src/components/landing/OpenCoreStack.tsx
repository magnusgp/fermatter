import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Github, Cloud, Lock, Key, Server, Users } from 'lucide-react'

export function OpenCoreStack() {
  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* SaaS Layer - Top */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-5 bg-gradient-to-r from-blue-500 to-indigo-600 border-0 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold">Managed SaaS</h4>
              <p className="text-xs text-blue-100">For teams & enterprises</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-1.5 bg-white/10 rounded px-2 py-1.5">
              <Users className="w-3 h-3" />
              <span>Teams</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 rounded px-2 py-1.5">
              <Lock className="w-3 h-3" />
              <span>SSO</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 rounded px-2 py-1.5">
              <Server className="w-3 h-3" />
              <span>Hosted</span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Connector */}
      <div className="flex justify-center">
        <motion.div
          className="w-px h-8 bg-gradient-to-b from-blue-400 to-gray-300"
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        />
      </div>

      {/* Open Source Layer - Bottom */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5 }}
      >
        <Card className="p-5 bg-gray-900 border-gray-700 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold">Open Source Core</h4>
              <p className="text-xs text-gray-400">Self-host, BYO key</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5 bg-gray-800 rounded px-2 py-1.5">
              <Key className="w-3 h-3 text-yellow-400" />
              <span>Bring your own API key</span>
            </div>
            <div className="flex items-center gap-1.5 bg-gray-800 rounded px-2 py-1.5">
              <Github className="w-3 h-3 text-gray-400" />
              <span>Fork & extend</span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Labels */}
      <div className="flex justify-between text-xs text-gray-500 pt-2">
        <span>💰 Revenue</span>
        <span>🌍 Community</span>
      </div>
    </div>
  )
}

export function AdapterDiagram() {
  const adapters = [
    { name: 'OpenAI', color: 'bg-green-100 text-green-700 border-green-200' },
    { name: 'Claude', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    { name: 'Local LLM', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  ]

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Core */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="relative"
      >
        <Card className="p-4 bg-blue-600 text-white border-0 text-center shadow-lg">
          <div className="text-sm font-bold">Fermatter Core</div>
          <div className="text-[10px] opacity-75">Provider Adapter Interface</div>
        </Card>

        {/* Connectors */}
        <svg className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-32 h-6" viewBox="0 0 128 24">
          <path d="M64 0 L16 24" stroke="#3B82F6" strokeWidth="2" fill="none" />
          <path d="M64 0 L64 24" stroke="#3B82F6" strokeWidth="2" fill="none" />
          <path d="M64 0 L112 24" stroke="#3B82F6" strokeWidth="2" fill="none" />
        </svg>
      </motion.div>

      {/* Adapters */}
      <div className="grid grid-cols-3 gap-2 mt-8">
        {adapters.map((adapter, i) => (
          <motion.div
            key={adapter.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 + i * 0.1 }}
          >
            <Card className={`p-3 text-center border ${adapter.color}`}>
              <div className="text-xs font-medium">{adapter.name}</div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
