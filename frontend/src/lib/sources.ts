import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from './firebase'

// Types
export interface LibrarySource {
  id: string
  userId: string
  title: string
  url: string
  snippet: string
  category: 'style-guide' | 'research' | 'reference' | 'custom'
  isBuiltIn: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateSourceInput {
  userId: string
  title: string
  url: string
  snippet: string
  category?: 'style-guide' | 'research' | 'reference' | 'custom'
}

export interface UpdateSourceInput {
  title?: string
  url?: string
  snippet?: string
  category?: 'style-guide' | 'research' | 'reference' | 'custom'
}

// Built-in demo sources (same as backend)
export const BUILT_IN_SOURCES: Omit<LibrarySource, 'userId' | 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'S1',
    title: 'The Elements of Style',
    url: 'https://en.wikipedia.org/wiki/The_Elements_of_Style',
    snippet: 'Omit needless words. Vigorous writing is concise. A sentence should contain no unnecessary words, a paragraph no unnecessary sentences.',
    category: 'style-guide',
    isBuiltIn: true,
  },
  {
    id: 'S2',
    title: 'On Writing Well - William Zinsser',
    url: 'https://en.wikipedia.org/wiki/On_Writing_Well',
    snippet: 'Clutter is the disease of American writing. We are a society strangling in unnecessary words, circular constructions, pompous frills and meaningless jargon.',
    category: 'style-guide',
    isBuiltIn: true,
  },
  {
    id: 'S3',
    title: 'APA Publication Manual (7th ed.)',
    url: 'https://apastyle.apa.org/',
    snippet: 'Scholarly writing should be clear, concise, and free of bias. Every claim should be supported by evidence, properly cited.',
    category: 'reference',
    isBuiltIn: true,
  },
  {
    id: 'S4',
    title: 'Chicago Manual of Style',
    url: 'https://www.chicagomanualofstyle.org/',
    snippet: 'Good writing is good thinking made visible. Structure your arguments logically and support claims with credible sources.',
    category: 'reference',
    isBuiltIn: true,
  },
  {
    id: 'S5',
    title: 'Nature: How to Write a Paper',
    url: 'https://www.nature.com/nature/for-authors/formatting-guide',
    snippet: 'Scientific papers should present findings clearly. Avoid jargon where possible. State limitations explicitly.',
    category: 'research',
    isBuiltIn: true,
  },
  {
    id: 'S6',
    title: 'Plain Language Guidelines',
    url: 'https://www.plainlanguage.gov/guidelines/',
    snippet: 'Use simple words and short sentences. Write for your reader, not yourself. Organize information logically.',
    category: 'style-guide',
    isBuiltIn: true,
  },
  {
    id: 'S7',
    title: 'Critical Thinking - Stanford Encyclopedia',
    url: 'https://plato.stanford.edu/entries/critical-thinking/',
    snippet: 'Critical thinking involves careful examination of claims and arguments. Identify assumptions, evaluate evidence, and consider alternative interpretations.',
    category: 'research',
    isBuiltIn: true,
  },
  {
    id: 'S8',
    title: 'Logical Fallacies - Purdue OWL',
    url: 'https://owl.purdue.edu/owl/general_writing/academic_writing/logic_in_argumentative_writing/',
    snippet: 'Common fallacies include ad hominem attacks, straw man arguments, false dichotomies, and appeals to authority without evidence.',
    category: 'reference',
    isBuiltIn: true,
  },
]

// Collection name
const SOURCES_COLLECTION = 'sources'

// Helper to convert Firestore timestamp to Date
function timestampToDate(timestamp: Timestamp | null): Date {
  return timestamp ? timestamp.toDate() : new Date()
}

// ==================== Source Operations ====================

/**
 * Get all sources for a user (built-in + custom)
 */
export async function getUserSources(userId: string): Promise<LibrarySource[]> {
  // Get custom sources from Firestore
  const sourcesRef = collection(db, SOURCES_COLLECTION)
  const q = query(
    sourcesRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  )
  
  const snapshot = await getDocs(q)
  const customSources: LibrarySource[] = snapshot.docs.map((docSnap) => {
    const data = docSnap.data()
    return {
      id: docSnap.id,
      userId: data.userId,
      title: data.title,
      url: data.url,
      snippet: data.snippet,
      category: data.category || 'custom',
      isBuiltIn: false,
      createdAt: timestampToDate(data.createdAt),
      updatedAt: timestampToDate(data.updatedAt),
    }
  })

  // Combine with built-in sources
  const builtInWithDates: LibrarySource[] = BUILT_IN_SOURCES.map((s) => ({
    ...s,
    userId: 'system',
    createdAt: new Date(0),
    updatedAt: new Date(0),
  }))

  return [...builtInWithDates, ...customSources]
}

/**
 * Get only built-in sources (for quick access without Firestore)
 */
export function getBuiltInSources(): LibrarySource[] {
  return BUILT_IN_SOURCES.map((s) => ({
    ...s,
    userId: 'system',
    createdAt: new Date(0),
    updatedAt: new Date(0),
  }))
}

/**
 * Get sources by IDs (for editor use)
 */
export function getSourcesByIds(ids: string[]): LibrarySource[] {
  const builtInSources = getBuiltInSources()
  return builtInSources.filter((s) => ids.includes(s.id))
}

/**
 * Create a custom source
 */
export async function createSource(input: CreateSourceInput): Promise<LibrarySource> {
  const now = serverTimestamp()
  
  const docData = {
    userId: input.userId,
    title: input.title,
    url: input.url,
    snippet: input.snippet,
    category: input.category || 'custom',
    isBuiltIn: false,
    createdAt: now,
    updatedAt: now,
  }

  const sourcesRef = collection(db, SOURCES_COLLECTION)
  const docRef = await addDoc(sourcesRef, docData)

  return {
    id: docRef.id,
    userId: input.userId,
    title: input.title,
    url: input.url,
    snippet: input.snippet,
    category: input.category || 'custom',
    isBuiltIn: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

/**
 * Update a custom source
 */
export async function updateSource(
  sourceId: string,
  updates: UpdateSourceInput
): Promise<void> {
  const docRef = doc(db, SOURCES_COLLECTION, sourceId)
  
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Delete a custom source
 */
export async function deleteSource(sourceId: string): Promise<void> {
  const docRef = doc(db, SOURCES_COLLECTION, sourceId)
  await deleteDoc(docRef)
}

/**
 * Subscribe to user's custom sources
 */
export function subscribeToUserSources(
  userId: string,
  callback: (sources: LibrarySource[]) => void
): Unsubscribe {
  const sourcesRef = collection(db, SOURCES_COLLECTION)
  const q = query(
    sourcesRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  )

  return onSnapshot(q, (snapshot) => {
    const customSources: LibrarySource[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        userId: data.userId,
        title: data.title,
        url: data.url,
        snippet: data.snippet,
        category: data.category || 'custom',
        isBuiltIn: false,
        createdAt: timestampToDate(data.createdAt),
        updatedAt: timestampToDate(data.updatedAt),
      }
    })

    // Combine with built-in sources
    const builtInWithDates: LibrarySource[] = BUILT_IN_SOURCES.map((s) => ({
      ...s,
      userId: 'system',
      createdAt: new Date(0),
      updatedAt: new Date(0),
    }))

    callback([...builtInWithDates, ...customSources])
  })
}

// Category display helpers
export const CATEGORY_LABELS: Record<LibrarySource['category'], string> = {
  'style-guide': 'Style Guide',
  'research': 'Research',
  'reference': 'Reference',
  'custom': 'Custom',
}

export const CATEGORY_COLORS: Record<LibrarySource['category'], string> = {
  'style-guide': 'blue',
  'research': 'green',
  'reference': 'amber',
  'custom': 'purple',
}
