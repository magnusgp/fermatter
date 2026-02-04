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

export interface Snapshot {
  ts: string // ISO8601 timestamp
  text: string
}

export interface Observation {
  id: string
  type: ObservationType
  severity: number // 1-3
  paragraph: number // zero-indexed
  title: string
  note: string
  question: string
}

export interface UnstableParagraph {
  paragraph: number // zero-indexed
  rewrite_count: number
  note: string
}

export interface Meta {
  paragraph_count: number
}

export interface AnalyzeRequest {
  text: string
  snapshots: Snapshot[]
  goal?: string
}

export interface AnalyzeResponse {
  observations: Observation[]
  unstable: UnstableParagraph[]
  meta: Meta
}

export interface HealthResponse {
  status: string
}
