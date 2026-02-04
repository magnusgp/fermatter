import { motion } from "framer-motion"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  MessageSquare,
  Target,
  Zap,
  Shield,
  ArrowRight,
  Sparkles,
  BookOpen,
  Users,
  Star,
  FileText,
  LogOut,
  Loader2,
} from "lucide-react"
import { useEffect, useRef } from "react"

export function LandingPage() {
  const { user, isAuthenticated, isLoading, signIn, signOut } = useAuth()
  const navigate = useNavigate()
  const pendingNavigate = useRef(false)

  // Navigate to dashboard after successful sign-in
  useEffect(() => {
    if (pendingNavigate.current && isAuthenticated) {
      pendingNavigate.current = false
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  const handleGetStarted = async () => {
    if (isAuthenticated) {
      navigate('/dashboard')
    } else {
      pendingNavigate.current = true
      await signIn()
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold text-foreground">Fermatter</h1>
            </Link>

            <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center gap-6 text-sm">
                <a href="#features" className="text-muted-foreground hover:text-foreground transition">
                  Features
                </a>
                <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition">
                  How It Works
                </a>
                <a href="#faq" className="text-muted-foreground hover:text-foreground transition">
                  FAQ
                </a>
              </nav>
              
              {isLoading ? (
                <Button disabled>
                  <Loader2 className="w-4 h-4 animate-spin" />
                </Button>
              ) : isAuthenticated && user ? (
                <div className="flex items-center gap-3">
                  <Link to="/dashboard">
                    <Button>
                      Dashboard
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                  <div className="flex items-center gap-2">
                    <img
                      src={user.imageUrl}
                      alt={user.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <button
                      onClick={signOut}
                      className="text-muted-foreground hover:text-foreground transition"
                      title="Sign out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <Button onClick={handleGetStarted}>
                  Sign In
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-background to-background" />
        <div className="container relative mx-auto px-4 py-20 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge className="mb-4 bg-blue-100 text-blue-700 border-blue-200">
                <Sparkles className="w-3 h-3 mr-1" />
                Writing Feedback, Not Rewriting
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                Questions That Make
                <br />
                <span className="text-blue-600">Your Writing Better</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Fermatter gives you smart feedback in the margins—asking the
                right questions and flagging issues without ever rewriting your
                work.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="text-base w-full sm:w-auto"
                  onClick={handleGetStarted}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {isAuthenticated ? 'Open Editor' : 'Try Fermatter Free'}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                <Button size="lg" variant="outline" className="text-base" asChild>
                  <a href="#how-it-works">See How It Works</a>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Proof Section */}
      <section className="py-16 border-b bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-8">
              Trusted by writers who care about their voice
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center opacity-60">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span className="font-medium">10k+ Writers</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                <span className="font-medium">500k+ Documents</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-current" />
                <span className="font-medium">4.9/5 Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                <span className="font-medium">2M+ Feedbacks</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Feedback That Respects Your Voice
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Write freely while getting precise, contextual feedback in the
              margins. No rewrites, no AI takeover—just smart questions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Target className="w-6 h-6" />,
                title: "Precise Margin Notes",
                description:
                  "Each note points to the exact phrase in your document. Hover to see connections, click to jump there instantly.",
              },
              {
                icon: <MessageSquare className="w-6 h-6" />,
                title: "Questions, Not Rewrites",
                description:
                  "Fermatter asks questions and flags issues—it never changes your words. Your voice stays 100% yours.",
              },
              {
                icon: <Zap className="w-6 h-6" />,
                title: "Mode-Based Critique",
                description:
                  "Switch between Scientific, Journalist, or Email to Grandma modes. Each adjusts the feedback style to your context.",
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: "Severity & Type Tags",
                description:
                  "Every note is tagged by type (clarity, grammar, style) and severity (low, medium, high) so you can prioritize.",
              },
              {
                icon: <BookOpen className="w-6 h-6" />,
                title: "Expand for Details",
                description:
                  "Collapsed notes show just the question. Expand to see the full quote, explanation, and tags.",
              },
              {
                icon: <Sparkles className="w-6 h-6" />,
                title: "Smooth Interactions",
                description:
                  "Hover highlights phrases, clicks scroll smoothly, expand/collapse works flawlessly—no broken connections.",
              },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="border rounded-lg p-6 bg-card hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-muted/30 border-y">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple, Trustworthy Workflow
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              No guessing, no broken links. Every feedback note maps directly to
              your text.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "01",
                title: "Write in the Editor",
                description:
                  "The left side is your writing space. Focus on your ideas, not formatting.",
              },
              {
                step: "02",
                title: "Get Margin Feedback",
                description:
                  "Notes appear on the right, each linked to a specific phrase. Hover to highlight, click to scroll.",
              },
              {
                step: "03",
                title: "Refine & Improve",
                description:
                  "Expand notes for details, adjust your writing, and watch your work get stronger—on your terms.",
              },
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="text-6xl font-bold text-blue-100 mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about Fermatter.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1" className="border rounded-lg px-6">
                <AccordionTrigger className="hover:no-underline">
                  Does Fermatter rewrite my text?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  No. Fermatter only asks questions and flags issues. It never
                  rewrites or changes your words. Your voice stays 100% yours.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="border rounded-lg px-6">
                <AccordionTrigger className="hover:no-underline">
                  What are Writing Modes?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Modes like "Scientific," "Journalist," or "Email to Grandma"
                  adjust the style and tone of feedback. They change how
                  Fermatter critiques—not what you write.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="border rounded-lg px-6">
                <AccordionTrigger className="hover:no-underline">
                  How do margin notes work?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Each note is linked to a specific phrase in your document.
                  Hover a note to highlight the phrase, click to scroll to it.
                  Expand notes to see the full quote, explanation, and tags.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="border rounded-lg px-6">
                <AccordionTrigger className="hover:no-underline">
                  What do the severity tags mean?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Severity tags (low, medium, high) help you prioritize. High
                  severity issues are critical, while low severity notes are
                  optional improvements.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="border rounded-lg px-6">
                <AccordionTrigger className="hover:no-underline">
                  Will expanding/collapsing notes break the mapping?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  No. This was a bug in earlier versions, but it's now fixed.
                  Expand and collapse as many times as you want—the connections
                  always work.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6" className="border rounded-lg px-6">
                <AccordionTrigger className="hover:no-underline">
                  Is Fermatter free?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Fermatter offers a free trial with full features. Paid plans
                  unlock unlimited documents and advanced modes.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Write Better?
          </h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Start getting smart feedback that respects your voice. No credit
            card required.
          </p>
          <Button
            size="lg"
            className="bg-white text-blue-600 hover:bg-blue-50 text-base"
            onClick={handleGetStarted}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            {isAuthenticated ? 'Open Editor' : 'Try Fermatter Free'}
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">Fermatter</h3>
              <p className="text-sm text-muted-foreground">
                Writing feedback that asks questions, not rewrites your work.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#features" className="hover:text-foreground transition">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-foreground transition">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition">
                    Changelog
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition">
                    Security
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>© 2024 Fermatter. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
