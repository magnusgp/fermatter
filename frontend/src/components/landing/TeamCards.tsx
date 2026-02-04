import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Rocket, Code, Palette, Lightbulb, Target, Zap } from 'lucide-react'

interface TeamMember {
  role: string
  name: string
  title: string
  bullets: string[]
  icon: React.ReactNode
  color: string
  image: string
}

const team: TeamMember[] = [
  {
    role: 'Hustler',
    name: 'Team Member',
    title: 'Business & Growth',
    bullets: ['GTM strategy', 'Investor relations'],
    icon: <Rocket className="w-5 h-5" />,
    color: 'from-amber-400 to-orange-500',
    image: '/team-1.jpeg',
  },
  {
    role: 'Hacker',
    name: 'Team Member',
    title: 'Engineering & AI',
    bullets: ['System architecture', 'LLM orchestration'],
    icon: <Code className="w-5 h-5" />,
    color: 'from-blue-400 to-indigo-500',
    image: '/team-2.jpeg',
  },
  {
    role: 'Hipster',
    name: 'Team Member',
    title: 'Design & Product',
    bullets: ['User experience', 'Brand & visual'],
    icon: <Palette className="w-5 h-5" />,
    color: 'from-pink-400 to-purple-500',
    image: '/team-3.jpeg',
  },
]

export function TeamCards() {
  return (
    <div className="grid md:grid-cols-3 gap-6 w-full max-w-4xl mx-auto">
      {team.map((member, i) => (
        <motion.div
          key={member.role}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 + i * 0.15 }}
        >
          <Card className="p-6 bg-white border-0 shadow-xl hover:shadow-2xl transition-shadow h-full">
            {/* Avatar */}
            <div
              className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${member.color} p-0.5 mb-4 shadow-lg`}
            >
              <img
                src={member.image}
                alt={member.name}
                className="w-full h-full rounded-2xl object-cover"
              />
            </div>

            {/* Role badge */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-gray-400">{member.icon}</span>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                {member.role}
              </span>
            </div>

            {/* Title */}
            <h4 className="font-bold text-lg text-gray-900 mb-3">{member.title}</h4>

            {/* Bullets */}
            <ul className="space-y-2">
              {member.bullets.map((bullet, j) => (
                <li key={j} className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  {bullet}
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

export function ValuePillars() {
  const pillars = [
    {
      icon: <Lightbulb className="w-6 h-6" />,
      title: 'Transparency',
      desc: 'Every critique is explainable',
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: 'Precision',
      desc: 'Anchored to exact phrases',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Control',
      desc: 'You decide what changes',
    },
  ]

  return (
    <div className="grid md:grid-cols-3 gap-6 w-full max-w-3xl mx-auto">
      {pillars.map((pillar, i) => (
        <motion.div
          key={pillar.title}
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 + i * 0.1 }}
        >
          <Card className="p-6 text-center bg-gradient-to-b from-blue-50 to-white border-blue-100 h-full">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4">
              {pillar.icon}
            </div>
            <h4 className="font-bold text-lg mb-2">{pillar.title}</h4>
            <p className="text-sm text-gray-600">{pillar.desc}</p>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
