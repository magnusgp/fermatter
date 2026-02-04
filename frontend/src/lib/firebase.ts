import { initializeApp, getApps } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

// Validate required environment variables
function requireEnv(name: string, value: unknown): string {
  if (!value || typeof value !== 'string') {
    throw new Error(`Missing env var: ${name}`)
  }
  return value
}

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
}

// Validate at startup (helps debug deploys)
requireEnv('VITE_FIREBASE_API_KEY', firebaseConfig.apiKey)
requireEnv('VITE_FIREBASE_AUTH_DOMAIN', firebaseConfig.authDomain)
requireEnv('VITE_FIREBASE_PROJECT_ID', firebaseConfig.projectId)
requireEnv('VITE_FIREBASE_APP_ID', firebaseConfig.appId)

// Initialize Firebase only if not already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

// Initialize Firestore
export const db = getFirestore(app)

// Initialize Auth
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

export default app
