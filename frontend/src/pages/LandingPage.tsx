import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth"
import { FileText, ArrowRight, LogOut, Loader2 } from "lucide-react"
import { PitchDeck } from "@/components/landing/PitchDeck"

export function LandingPage() {
  const { user, isAuthenticated, isLoading, signIn, signOut } = useAuth()
  const navigate = useNavigate()

  const handleGetStarted = async () => {
    if (isAuthenticated) {
      navigate('/dashboard')
    } else {
      await signIn()
    }
  }

  return (
    <div className="relative min-h-screen bg-background">
      {/* Floating Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold text-foreground">Fermatter</h1>
            </Link>

            <div className="flex items-center gap-4">
              {isLoading ? (
                <Button size="sm" disabled>
                  <Loader2 className="w-4 h-4 animate-spin" />
                </Button>
              ) : isAuthenticated && user ? (
                <div className="flex items-center gap-3">
                  <Link to="/dashboard">
                    <Button size="sm">
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
                <Button size="sm" onClick={handleGetStarted}>
                  Sign In
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Pitch Deck - Full page scroll experience */}
      <PitchDeck />
    </div>
  )
}

export default LandingPage
