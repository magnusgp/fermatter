/**
 * API client for the Fermatter backend.
 */

import type {
  AnalyzeRequest,
  AnalyzeResponse,
  HealthResponse,
  SourcesLibraryResponse,
} from './types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text()
    throw new ApiError(errorText || response.statusText, response.status)
  }
  return response.json() as Promise<T>
}

/**
 * Check the health of the backend.
 */
export async function checkHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/health`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  return handleResponse<HealthResponse>(response)
}

/**
 * Get available library sources.
 */
export async function getSources(): Promise<SourcesLibraryResponse> {
  const response = await fetch(`${API_BASE_URL}/sources`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  return handleResponse<SourcesLibraryResponse>(response)
}

/**
 * Analyze text and get structured feedback.
 */
export async function analyzeText(request: AnalyzeRequest): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })
  return handleResponse<AnalyzeResponse>(response)
}

export { ApiError }
