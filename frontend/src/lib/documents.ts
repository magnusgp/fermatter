import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from './firebase'

// Types
export interface Document {
  id: string
  userId: string
  title: string
  content: string
  mode: 'scientific' | 'journalist' | 'email' | 'general'
  wordCount: number
  feedbackCount: number
  createdAt: Date
  updatedAt: Date
  lastAnalyzedAt: Date | null
  sources?: { user: string[]; library_ids: string[] }
  documentContext?: string
}

export interface UserMetrics {
  userId: string
  totalDocuments: number
  totalWords: number
  totalFeedbackResolved: number
  writingTimeSeconds: number
  lastActiveAt: Date
  weeklyStats: {
    writingTimeSeconds: number
    documentsCreated: number
    feedbackResolved: number
    wordsWritten: number
  }
}

// Document creation input
export interface CreateDocumentInput {
  userId: string
  title: string
  content?: string
  mode?: 'scientific' | 'journalist' | 'email' | 'general'
  sources?: { user: string[]; library_ids: string[] }
  documentContext?: string
}

// Document update input
export interface UpdateDocumentInput {
  title?: string
  content?: string
  mode?: 'scientific' | 'journalist' | 'email' | 'general'
  feedbackCount?: number
  sources?: { user: string[]; library_ids: string[] }
  documentContext?: string
  lastAnalyzedAt?: Date
}

// Helper to count words
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

// Helper to convert Firestore timestamp to Date
function timestampToDate(timestamp: Timestamp | null): Date | null {
  return timestamp ? timestamp.toDate() : null
}

// Documents Collection
const DOCUMENTS_COLLECTION = 'documents'
const METRICS_COLLECTION = 'userMetrics'

// ==================== Document Operations ====================

export async function createDocument(input: CreateDocumentInput): Promise<Document> {
  const now = serverTimestamp()
  const content = input.content || ''
  
  const docData = {
    userId: input.userId,
    title: input.title,
    content,
    mode: input.mode || 'scientific',
    wordCount: countWords(content),
    feedbackCount: 0,
    createdAt: now,
    updatedAt: now,
    lastAnalyzedAt: null,
    sources: input.sources || { user: [], library_ids: [] },
    documentContext: input.documentContext || '',
  }

  const docRef = await addDoc(collection(db, DOCUMENTS_COLLECTION), docData)
  
  // Update user metrics
  try {
    const { increment, setDoc } = await import('firebase/firestore')
    const metricsRef = doc(db, METRICS_COLLECTION, input.userId)
    await updateDoc(metricsRef, {
      totalDocuments: increment(1),
      'weeklyStats.documentsCreated': increment(1),
      lastActiveAt: serverTimestamp(),
    }).catch(async () => {
      // Metrics don't exist yet, create them
      await setDoc(metricsRef, {
        userId: input.userId,
        totalDocuments: 1,
        totalWords: 0,
        totalFeedbackResolved: 0,
        writingTimeSeconds: 0,
        lastActiveAt: serverTimestamp(),
        weeklyStats: {
          writingTimeSeconds: 0,
          documentsCreated: 1,
          feedbackResolved: 0,
          wordsWritten: 0,
        },
      })
    })
  } catch (err) {
    console.error('Failed to update metrics:', err)
  }
  
  // Return the created document
  const createdDoc = await getDoc(docRef)
  const data = createdDoc.data()!
  
  return {
    id: docRef.id,
    userId: data.userId,
    title: data.title,
    content: data.content,
    mode: data.mode,
    wordCount: data.wordCount,
    feedbackCount: data.feedbackCount,
    createdAt: timestampToDate(data.createdAt) || new Date(),
    updatedAt: timestampToDate(data.updatedAt) || new Date(),
    lastAnalyzedAt: timestampToDate(data.lastAnalyzedAt),
    sources: data.sources,
    documentContext: data.documentContext,
  }
}

export async function getDocument(documentId: string): Promise<Document | null> {
  const docRef = doc(db, DOCUMENTS_COLLECTION, documentId)
  const docSnap = await getDoc(docRef)
  
  if (!docSnap.exists()) {
    return null
  }
  
  const data = docSnap.data()
  return {
    id: docSnap.id,
    userId: data.userId,
    title: data.title,
    content: data.content,
    mode: data.mode,
    wordCount: data.wordCount,
    feedbackCount: data.feedbackCount,
    createdAt: timestampToDate(data.createdAt) || new Date(),
    updatedAt: timestampToDate(data.updatedAt) || new Date(),
    lastAnalyzedAt: timestampToDate(data.lastAnalyzedAt),
    sources: data.sources,
    documentContext: data.documentContext,
  }
}

export async function getUserDocuments(userId: string): Promise<Document[]> {
  const q = query(
    collection(db, DOCUMENTS_COLLECTION),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  )
  
  const querySnapshot = await getDocs(q)
  
  return querySnapshot.docs.map((docSnap) => {
    const data = docSnap.data()
    return {
      id: docSnap.id,
      userId: data.userId,
      title: data.title,
      content: data.content,
      mode: data.mode,
      wordCount: data.wordCount,
      feedbackCount: data.feedbackCount,
      createdAt: timestampToDate(data.createdAt) || new Date(),
      updatedAt: timestampToDate(data.updatedAt) || new Date(),
      lastAnalyzedAt: timestampToDate(data.lastAnalyzedAt),
      sources: data.sources,
      documentContext: data.documentContext,
    }
  })
}

export async function getRecentDocuments(userId: string, count: number = 5): Promise<Document[]> {
  const q = query(
    collection(db, DOCUMENTS_COLLECTION),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc'),
    limit(count)
  )
  
  const querySnapshot = await getDocs(q)
  
  return querySnapshot.docs.map((docSnap) => {
    const data = docSnap.data()
    return {
      id: docSnap.id,
      userId: data.userId,
      title: data.title,
      content: data.content,
      mode: data.mode,
      wordCount: data.wordCount,
      feedbackCount: data.feedbackCount,
      createdAt: timestampToDate(data.createdAt) || new Date(),
      updatedAt: timestampToDate(data.updatedAt) || new Date(),
      lastAnalyzedAt: timestampToDate(data.lastAnalyzedAt),
      sources: data.sources,
      documentContext: data.documentContext,
    }
  })
}

export async function updateDocument(
  documentId: string,
  updates: UpdateDocumentInput
): Promise<void> {
  const docRef = doc(db, DOCUMENTS_COLLECTION, documentId)
  
  const updateData: Record<string, unknown> = {
    ...updates,
    updatedAt: serverTimestamp(),
  }
  
  // Update word count if content changed
  if (updates.content !== undefined) {
    updateData.wordCount = countWords(updates.content)
  }
  
  await updateDoc(docRef, updateData)
}

export async function deleteDocument(documentId: string): Promise<void> {
  const docRef = doc(db, DOCUMENTS_COLLECTION, documentId)
  await deleteDoc(docRef)
}

// Real-time document subscription
export function subscribeToDocument(
  documentId: string,
  callback: (doc: Document | null) => void
): Unsubscribe {
  const docRef = doc(db, DOCUMENTS_COLLECTION, documentId)
  
  return onSnapshot(docRef, (docSnap) => {
    if (!docSnap.exists()) {
      callback(null)
      return
    }
    
    const data = docSnap.data()
    callback({
      id: docSnap.id,
      userId: data.userId,
      title: data.title,
      content: data.content,
      mode: data.mode,
      wordCount: data.wordCount,
      feedbackCount: data.feedbackCount,
      createdAt: timestampToDate(data.createdAt) || new Date(),
      updatedAt: timestampToDate(data.updatedAt) || new Date(),
      lastAnalyzedAt: timestampToDate(data.lastAnalyzedAt),
      sources: data.sources,
      documentContext: data.documentContext,
    })
  })
}

// Real-time user documents subscription
export function subscribeToUserDocuments(
  userId: string,
  callback: (docs: Document[]) => void
): Unsubscribe {
  const q = query(
    collection(db, DOCUMENTS_COLLECTION),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  )
  
  return onSnapshot(q, (querySnapshot) => {
    const docs = querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        userId: data.userId,
        title: data.title,
        content: data.content,
        mode: data.mode,
        wordCount: data.wordCount,
        feedbackCount: data.feedbackCount,
        createdAt: timestampToDate(data.createdAt) || new Date(),
        updatedAt: timestampToDate(data.updatedAt) || new Date(),
        lastAnalyzedAt: timestampToDate(data.lastAnalyzedAt),
        sources: data.sources,
        documentContext: data.documentContext,
      }
    })
    callback(docs)
  })
}

// ==================== User Metrics Operations ====================

export async function getUserMetrics(userId: string): Promise<UserMetrics | null> {
  const docRef = doc(db, METRICS_COLLECTION, userId)
  const docSnap = await getDoc(docRef)
  
  if (!docSnap.exists()) {
    return null
  }
  
  const data = docSnap.data()
  return {
    userId: data.userId,
    totalDocuments: data.totalDocuments,
    totalWords: data.totalWords,
    totalFeedbackResolved: data.totalFeedbackResolved,
    writingTimeSeconds: data.writingTimeSeconds,
    lastActiveAt: timestampToDate(data.lastActiveAt) || new Date(),
    weeklyStats: data.weeklyStats || {
      writingTimeSeconds: 0,
      documentsCreated: 0,
      feedbackResolved: 0,
      wordsWritten: 0,
    },
  }
}

export async function initializeUserMetrics(userId: string): Promise<void> {
  const docRef = doc(db, METRICS_COLLECTION, userId)
  const docSnap = await getDoc(docRef)
  
  if (!docSnap.exists()) {
    await updateDoc(docRef, {
      userId,
      totalDocuments: 0,
      totalWords: 0,
      totalFeedbackResolved: 0,
      writingTimeSeconds: 0,
      lastActiveAt: serverTimestamp(),
      weeklyStats: {
        writingTimeSeconds: 0,
        documentsCreated: 0,
        feedbackResolved: 0,
        wordsWritten: 0,
      },
    }).catch(async () => {
      // Document doesn't exist, create it
      const { setDoc } = await import('firebase/firestore')
      await setDoc(docRef, {
        userId,
        totalDocuments: 0,
        totalWords: 0,
        totalFeedbackResolved: 0,
        writingTimeSeconds: 0,
        lastActiveAt: serverTimestamp(),
        weeklyStats: {
          writingTimeSeconds: 0,
          documentsCreated: 0,
          feedbackResolved: 0,
          wordsWritten: 0,
        },
      })
    })
  }
}

export async function incrementWritingTime(
  userId: string,
  seconds: number
): Promise<void> {
  const { increment } = await import('firebase/firestore')
  const docRef = doc(db, METRICS_COLLECTION, userId)
  
  await updateDoc(docRef, {
    writingTimeSeconds: increment(seconds),
    'weeklyStats.writingTimeSeconds': increment(seconds),
    lastActiveAt: serverTimestamp(),
  }).catch(() => {
    // Metrics don't exist yet, initialize them
    initializeUserMetrics(userId)
  })
}

export async function incrementFeedbackResolved(
  userId: string,
  count: number = 1
): Promise<void> {
  const { increment } = await import('firebase/firestore')
  const docRef = doc(db, METRICS_COLLECTION, userId)
  
  await updateDoc(docRef, {
    totalFeedbackResolved: increment(count),
    'weeklyStats.feedbackResolved': increment(count),
    lastActiveAt: serverTimestamp(),
  }).catch(() => {
    initializeUserMetrics(userId)
  })
}

// Subscribe to user metrics in real-time
export function subscribeToUserMetrics(
  userId: string,
  callback: (metrics: UserMetrics | null) => void
): Unsubscribe {
  const docRef = doc(db, METRICS_COLLECTION, userId)
  
  return onSnapshot(docRef, (docSnap) => {
    if (!docSnap.exists()) {
      callback(null)
      return
    }
    
    const data = docSnap.data()
    callback({
      userId: data.userId,
      totalDocuments: data.totalDocuments,
      totalWords: data.totalWords,
      totalFeedbackResolved: data.totalFeedbackResolved,
      writingTimeSeconds: data.writingTimeSeconds,
      lastActiveAt: timestampToDate(data.lastActiveAt) || new Date(),
      weeklyStats: data.weeklyStats || {
        writingTimeSeconds: 0,
        documentsCreated: 0,
        feedbackResolved: 0,
        wordsWritten: 0,
      },
    })
  })
}

// Format seconds to human-readable time
export function formatWritingTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}.${Math.floor(minutes / 6)} hrs`
  }
  return `${minutes} min`
}

// Format relative time
export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffSecs < 60) return 'just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  
  return date.toLocaleDateString()
}
