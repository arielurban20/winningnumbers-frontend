// Centralized API client with retry logic and error handling
// CRITICAL: No /api duplication - base URL does NOT include /api, endpoints START with /api

import type { APIError } from "@/types/api"

// Server-side uses API_BASE_URL, client-side uses NEXT_PUBLIC_API_BASE_URL
function getBaseUrl(): string {
  if (typeof window === "undefined") {
    // Server-side
    return process.env.API_BASE_URL || "https://winningnumbers.us"
  }
  // Client-side
  return process.env.NEXT_PUBLIC_API_BASE_URL || "https://winningnumbers.us"
}

interface FetchOptions extends RequestInit {
  retries?: number
  retryDelay?: number
  timeout?: number
  /** If true, uses Next.js revalidation cache instead of no-store */
  useCache?: boolean
  /** Revalidation time in seconds (default: 60 for cached requests) */
  revalidate?: number
}

interface APIResponse<T> {
  data: T | null
  error: APIError | null
}

// Exponential backoff delays in milliseconds
const RETRY_DELAYS = [1000, 2000, 4000]

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function apiClient<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<APIResponse<T>> {
  const { retries = 3, timeout = 10000, useCache = false, revalidate = 60, ...fetchOptions } = options

  // Ensure endpoint starts with /api (CRITICAL: no duplication)
  const normalizedEndpoint = endpoint.startsWith("/api")
    ? endpoint
    : `/api${endpoint.startsWith("/") ? "" : "/"}${endpoint}`

  const url = `${getBaseUrl()}${normalizedEndpoint}`

  let lastError: APIError | null = null

  for (let attempt = 0; attempt < retries; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      // Build fetch options with appropriate caching strategy
      const finalFetchOptions: RequestInit = {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...fetchOptions.headers,
        },
      }
      
      // Use Next.js caching with revalidation for static-ish data (states list, games list)
      // Use no-store for dynamic data (draw results)
      if (useCache) {
        finalFetchOptions.next = { revalidate }
      } else {
        finalFetchOptions.cache = "no-store"
      }

      const response = await fetch(url, finalFetchOptions)

      clearTimeout(timeoutId)

      if (!response.ok) {
        lastError = {
          message: `API error: ${response.statusText}`,
          status: response.status,
        }

        // Don't retry on 4xx errors (except 429)
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          return { data: null, error: lastError }
        }

        // Retry on 5xx errors and 429
        if (attempt < retries - 1) {
          await delay(RETRY_DELAYS[attempt] || 4000)
          continue
        }

        return { data: null, error: lastError }
      }

      // Handle empty responses
      const text = await response.text()
      if (!text || text.trim() === "") {
        return { data: null, error: null }
      }

      // Safe JSON parsing
      try {
        const data = JSON.parse(text) as T
        return { data: normalizeResponse(data), error: null }
      } catch {
        return {
          data: null,
          error: { message: "Invalid JSON response", status: 500 },
        }
      }
    } catch (err) {
      clearTimeout(timeoutId)

      if (err instanceof Error) {
        if (err.name === "AbortError") {
          lastError = { message: "Request timeout", status: 408 }
        } else {
          lastError = { message: err.message, status: 500 }
        }
      } else {
        lastError = { message: "Unknown error", status: 500 }
      }

      // Retry on network errors
      if (attempt < retries - 1) {
        await delay(RETRY_DELAYS[attempt] || 4000)
        continue
      }
    }
  }

  return { data: null, error: lastError }
}

// Normalize response to ensure arrays are never undefined
function normalizeResponse<T>(data: T): T {
  if (data === null || data === undefined) {
    return data
  }

  if (Array.isArray(data)) {
    return data.map(normalizeResponse) as T
  }

  if (typeof data === "object") {
    const normalized = { ...data } as Record<string, unknown>

    // Normalize known array fields
    const arrayFields = ["bonus_items", "extra_items", "main_numbers", "draw_days", "main_items", "highlighted_main_numbers"]
    for (const field of arrayFields) {
      if (field in normalized && !Array.isArray(normalized[field])) {
        normalized[field] = []
      }
    }

    // Recursively normalize nested objects
    for (const key of Object.keys(normalized)) {
      if (typeof normalized[key] === "object" && normalized[key] !== null) {
        normalized[key] = normalizeResponse(normalized[key])
      }
    }

    return normalized as T
  }

  return data
}

// Helper for GET requests (no cache by default - for dynamic data like draw results)
export async function apiGet<T>(endpoint: string, options?: FetchOptions): Promise<APIResponse<T>> {
  return apiClient<T>(endpoint, { ...options, method: "GET" })
}

// Helper for GET requests with caching (for semi-static data like states list, games list)
export async function apiGetCached<T>(
  endpoint: string, 
  revalidateSeconds: number = 300,
  options?: FetchOptions
): Promise<APIResponse<T>> {
  return apiClient<T>(endpoint, { 
    ...options, 
    method: "GET", 
    useCache: true, 
    revalidate: revalidateSeconds 
  })
}
