import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from 'firebase/auth'
import { auth, googleProvider } from './firebase'

export interface User {
  id: string
  name: string
  email: string
  imageUrl: string
}

interface AuthContextType {
  user: User | null
  firebaseUser: FirebaseUser | null
  isAuthenticated: boolean
  isLoading: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  error: string | null
}

const AuthContext = createContext<AuthContextType | null>(null)

function mapFirebaseUser(firebaseUser: FirebaseUser): User {
  return {
    id: firebaseUser.uid,
    name: firebaseUser.displayName || 'User',
    email: firebaseUser.email || '',
    imageUrl: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.displayName || 'U')}&background=random`,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser)
        setUser(mapFirebaseUser(fbUser))
      } else {
        setFirebaseUser(null)
        setUser(null)
      }
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signIn = useCallback(async () => {
    try {
      setError(null)
      await signInWithPopup(auth, googleProvider)
      // User state will be updated by onAuthStateChanged listener
    } catch (err) {
      console.error('Sign-in error:', err)
      const errorCode = (err as { code?: string })?.code
      // Don't show error if user closed the popup
      if (errorCode !== 'auth/popup-closed-by-user' && errorCode !== 'auth/cancelled-popup-request') {
        setError('Failed to sign in with Google')
      }
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(auth)
      // User state will be updated by onAuthStateChanged listener
    } catch (err) {
      console.error('Sign-out error:', err)
      setError('Failed to sign out')
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        isAuthenticated: !!user,
        isLoading,
        signIn,
        signOut,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
