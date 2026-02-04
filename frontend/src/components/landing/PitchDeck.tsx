import { useRef, useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, ArrowDown, Loader2, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/lib/auth'

import { PitchSlide, SlideHeadline, SlideSubheadline, SlideBullets, SlideGrid } from './PitchSlide'
import { DeckNav, DeckProgress } from './DeckNav'
import { FermatMarginViz } from './FermatMarginViz'
import { BlackBoxVsRailsViz } from './BlackBoxVsRailsViz'
import { CompetitorMatrix } from './CompetitorMatrix'
import { OpenCoreStack, AdapterDiagram } from './OpenCoreStack'
import { TeamCards, ValuePillars } from './TeamCards'

const SECTIONS = [
  'Title',
  'Problem',
  'Team',
  'Philosophy',
  'Value',
  'Tech & Business',
  'Demo',
]

export function PitchDeck() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading, signIn } = useAuth()
  const containerRef = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<(HTMLElement | null)[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const pendingNavigate = useRef(false)

  // Navigate to dashboard after sign-in
  useEffect(() => {
    if (pendingNavigate.current && isAuthenticated) {
      pendingNavigate.current = false
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  // Intersection Observer for active slide tracking
  useEffect(() => {
    const observers: IntersectionObserver[] = []

    slideRefs.current.forEach((ref, index) => {
      if (!ref) return

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
              setActiveIndex(index)
            }
          })
        },
        { threshold: 0.5 }
      )

      observer.observe(ref)
      observers.push(observer)
    })

    return () => {
      observers.forEach((obs) => obs.disconnect())
    }
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault()
        navigateSlide(Math.min(activeIndex + 1, SECTIONS.length - 1))
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault()
        navigateSlide(Math.max(activeIndex - 1, 0))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeIndex])

  const navigateSlide = useCallback((index: number) => {
    slideRefs.current[index]?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const handleEnterFermatter = async () => {
    if (isAuthenticated) {
      navigate('/dashboard')
    } else {
      pendingNavigate.current = true
      await signIn()
    }
  }

  const setSlideRef = (index: number) => (el: HTMLElement | null) => {
    slideRefs.current[index] = el
  }

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-y-auto snap-y snap-mandatory scroll-smooth"
    >
      {/* Navigation */}
      <DeckNav sections={SECTIONS} activeIndex={activeIndex} onNavigate={navigateSlide} />
      <DeckProgress current={activeIndex} total={SECTIONS.length} />

      {/* ===== SLIDE 1: TITLE ===== */}
      <PitchSlide ref={setSlideRef(0)} id="title">
        <SlideGrid>
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-4 bg-blue-100 text-blue-700 border-blue-200">
                Pitch Deck
              </Badge>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4">
                Fermatter
              </h1>
              <SlideSubheadline className="text-blue-600 font-semibold">
                Your Brain, Our Rails.
              </SlideSubheadline>
              <p className="text-xl text-muted-foreground mb-8 italic">
                "Great ideas happen in the margins."
              </p>
              <SlideBullets
                items={[
                  'Feedback, not rewriting.',
                  'Anchored to the exact phrase.',
                  'You stay in control.',
                ]}
              />

              <div className="mt-10 flex items-center gap-4">
                <Button size="lg" onClick={handleEnterFermatter} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {isAuthenticated ? 'Open Editor' : 'Enter Fermatter'}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  onClick={() => navigateSlide(1)}
                  className="gap-2"
                >
                  <ArrowDown className="w-4 h-4" />
                  Explore
                </Button>
              </div>
            </motion.div>
          </div>
          <div className="hidden md:block">
            <FermatMarginViz />
          </div>
        </SlideGrid>
      </PitchSlide>

      {/* ===== SLIDE 2: PROBLEM ===== */}
      <PitchSlide ref={setSlideRef(1)} id="problem" variant="dark">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-red-500/20 text-red-400 border-red-500/30">
            The Problem
          </Badge>
          <SlideHeadline className="text-white">
            Modern AI writing tools are a{' '}
            <span className="text-red-400">black box.</span>
          </SlideHeadline>
        </div>
        <SlideBullets
          className="max-w-xl mx-auto mb-12 text-gray-300"
          items={[
            'They overwrite your voice.',
            'Opaque changes you can\'t audit.',
            'Undeterministic rewrites ≠ learning.',
          ]}
        />
        <BlackBoxVsRailsViz />
      </PitchSlide>

      {/* ===== SLIDE 3: TEAM ===== */}
      <PitchSlide ref={setSlideRef(2)} id="team">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-purple-100 text-purple-700 border-purple-200">
            The Team
          </Badge>
          <SlideHeadline>A builder team with taste.</SlideHeadline>
        </div>
        <TeamCards />
      </PitchSlide>

      {/* ===== SLIDE 4: PHILOSOPHY ===== */}
      <PitchSlide ref={setSlideRef(3)} id="philosophy">
        <SlideGrid>
          <div>
            <Badge className="mb-4 bg-blue-100 text-blue-700 border-blue-200">
              Philosophy
            </Badge>
            <SlideHeadline>
              We don't write for you.
              <br />
              <span className="text-blue-600">We hold up a mirror.</span>
            </SlideHeadline>
            <SlideBullets
              className="mt-8"
              items={[
                'Questions that reveal structure.',
                'Critique that\'s explainable.',
                'Authorship stays human.',
              ]}
            />
          </div>
          <div className="hidden md:block">
            <FermatMarginViz />
          </div>
        </SlideGrid>
      </PitchSlide>

      {/* ===== SLIDE 5: VALUE PROPOSITION ===== */}
      <PitchSlide ref={setSlideRef(4)} id="value" variant="gradient">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-white/20 text-white border-white/30">
            Value Proposition
          </Badge>
          <SlideHeadline className="text-white">
            Radical transparency + full control.
          </SlideHeadline>
          <p className="text-xl text-blue-100 mt-4 max-w-2xl mx-auto">
            Citations & sources. Model-agnostic. Feedback anchored to your text.
          </p>
        </div>
        <ValuePillars />
      </PitchSlide>

      {/* ===== SLIDE 6: TECH & BUSINESS ===== */}
      <PitchSlide ref={setSlideRef(5)} id="tech-business">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-indigo-100 text-indigo-700 border-indigo-200">
            Technical Edge & Business Model
          </Badge>
          <SlideHeadline>Built to scale. Built to last.</SlideHeadline>
        </div>

        <Tabs defaultValue="extensibility" className="max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="extensibility">Extensibility</TabsTrigger>
            <TabsTrigger value="opencore">Open Core Model</TabsTrigger>
          </TabsList>
          <TabsContent value="extensibility" className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h4 className="font-bold text-xl mb-4">Provider Adapters</h4>
                <SlideBullets
                  items={[
                    'OpenAI / Claude / Local LLM support.',
                    'Pluggable backend rules.',
                    'OpenAPI contract, typed schema.',
                  ]}
                />
              </div>
              <AdapterDiagram />
            </div>
          </TabsContent>
          <TabsContent value="opencore" className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h4 className="font-bold text-xl mb-4">Two-Tier Model</h4>
                <SlideBullets
                  items={[
                    'Open-source core (BYO key).',
                    'Managed SaaS for teams & pros.',
                    'Hosted, fast, compliant.',
                  ]}
                />
              </div>
              <OpenCoreStack />
            </div>
          </TabsContent>
        </Tabs>
      </PitchSlide>

      {/* ===== SLIDE 7: DEMO TRANSITION ===== */}
      <PitchSlide ref={setSlideRef(6)} id="demo" variant="gradient">
        <div className="text-center">
          <Badge className="mb-4 bg-white/20 text-white border-white/30">
            See It In Action
          </Badge>
          <SlideHeadline className="text-white mb-4">
            Transparent analytics beats opaque generation.
          </SlideHeadline>

          <div className="max-w-lg mx-auto mb-12">
            <CompetitorMatrix />
          </div>

          <SlideBullets
            className="max-w-xl mx-auto mb-12 text-blue-100"
            items={[
              'No silent rewrites.',
              'Auditability by design.',
              'From critique → better thinking.',
            ]}
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="pt-8 border-t border-white/20"
          >
            <p className="text-xl text-blue-100 mb-6 font-medium">
              From theory to reality.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-blue-50"
                onClick={handleEnterFermatter}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {isAuthenticated ? 'Open Editor' : 'Enter Fermatter'}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white bg-white text-gray-900 hover:bg-gray-100"
                onClick={() => navigateSlide(0)}
              >
                <Play className="w-4 h-4 mr-2" />
                Replay Deck
              </Button>
            </div>
          </motion.div>

          {/* Scroll hint for first-time visitors */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 1 }}
          >
            <p className="text-xs text-white/50">
              Use ↑↓ keys or scroll to navigate
            </p>
          </motion.div>
        </div>
      </PitchSlide>
    </div>
  )
}
