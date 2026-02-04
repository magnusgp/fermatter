/**
 * Types for the Fermatter API.
 * Mirrors the backend Pydantic schemas.
 */

export type ObservationType =
  | 'missing_evidence'
  | 'unclear_claim'
  | 'logic_gap'
  | 'structure'
  | 'instability'
  | 'tone'
  | 'precision'
  | 'citation_needed'

export type AnalysisMode = 'scientific' | 'journalist' | 'grandma'

export type ScopeType = 'document' | 'selection'

export interface Snapshot {
  ts: string // ISO8601 timestamp
  text: string
}

export interface SourcesInput {
  user: string[] // User-provided URLs or citation strings
  library_ids: string[] // Selected demo source IDs (e.g., S1, S2)
}

export interface AnalysisScope {
  type: ScopeType
  paragraphs?: number[] // Analyze only these paragraph indices
  selection_text?: string // Text selection to analyze
}

export interface Observation {
  id: string
  type: ObservationType
  severity: number // 1-5
  paragraph: number // zero-indexed
  anchor_text?: string // short quoted fragment
  title: string
  note: string
  question: string
  source_ids: string[] // Referenced source IDs
}

export interface UnstableParagraph {
  paragraph: number // zero-indexed
  rewrite_count: number
  note: string
}

export interface SourceUsed {
  id: string
  title: string
  url: string
}

export interface Meta {
  paragraph_count: number
  latency_ms: number
  used_llm: boolean
  warning?: string // Warning if LLM analysis failed
}

export interface AnalyzeRequest {
  text: string
  snapshots: Snapshot[]
  goal?: string
  mode: AnalysisMode
  sources: SourcesInput
  scope: AnalysisScope
}

export interface AnalyzeResponse {
  observations: Observation[]
  unstable: UnstableParagraph[]
  sources_used: SourceUsed[]
  meta: Meta
}

export interface HealthResponse {
  status: string
}

// Library source types
export interface LibrarySource {
  id: string
  title: string
  url: string
  snippet: string
}

export interface SourcesLibraryResponse {
  sources: LibrarySource[]
}
