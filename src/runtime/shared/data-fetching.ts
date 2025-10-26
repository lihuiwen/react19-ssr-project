/**
 * Data Fetching Utilities (Phase 4)
 *
 * High-level API for data fetching with React 19's use() Hook:
 * - Request deduplication
 * - Automatic caching
 * - Server/client compatibility
 *
 * @see https://react.dev/reference/react/use
 */

import {
  createCachedResource,
  preloadResource,
  invalidateResource,
  isServer,
  type Resource,
} from './resource'

/**
 * Fetch options
 */
export interface FetchOptions extends RequestInit {
  /** Cache key (auto-generated if not provided) */
  cacheKey?: string
  /** Cache TTL in milliseconds (default: 5 minutes) */
  ttl?: number
  /** Base URL for API requests */
  baseURL?: string
  /** Retry failed requests */
  retry?: {
    attempts: number
    delay: number
  }
}

/**
 * In-flight requests map (for deduplication)
 */
const inflightRequests = new Map<string, Promise<any>>()

/**
 * Generate cache key from URL and options
 */
function generateCacheKey(url: string, options?: FetchOptions): string {
  if (options?.cacheKey) {
    return options.cacheKey
  }

  // Create deterministic key from URL + method + body
  const method = options?.method || 'GET'
  const body = options?.body ? JSON.stringify(options.body) : ''
  return `fetch:${method}:${url}${body ? `:${body}` : ''}`
}

/**
 * Resolve full URL (handles relative URLs and baseURL)
 */
function resolveURL(url: string, baseURL?: string): string {
  // If URL is absolute, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  // If no baseURL provided, use current origin in browser or localhost in server
  if (!baseURL) {
    if (!isServer()) {
      baseURL = window.location.origin
    } else {
      baseURL = 'http://localhost:3000'
    }
  }

  // Ensure baseURL doesn't end with slash
  baseURL = baseURL.replace(/\/$/, '')

  // Ensure url starts with slash
  if (!url.startsWith('/')) {
    url = '/' + url
  }

  return `${baseURL}${url}`
}

/**
 * Enhanced fetch with retries
 */
async function fetchWithRetry<T>(
  url: string,
  options?: FetchOptions
): Promise<T> {
  const { retry, ...fetchOptions } = options || {}
  const attempts = retry?.attempts || 1
  const delay = retry?.delay || 1000

  let lastError: Error | null = null

  for (let i = 0; i < attempts; i++) {
    try {
      const response = await fetch(url, fetchOptions)

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}: ${response.statusText}`
        )
      }

      return await response.json()
    } catch (error) {
      lastError = error as Error
      console.error(`[Fetch] Attempt ${i + 1}/${attempts} failed:`, error)

      if (i < attempts - 1) {
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}

/**
 * Fetch data with automatic resource management
 *
 * This is the primary API for data fetching in the framework.
 * It handles:
 * - Request deduplication (multiple calls with same URL return same promise)
 * - Automatic caching (based on cache key and TTL)
 * - Server/client compatibility
 *
 * @example
 * ```tsx
 * // In your component
 * function BlogPost({ id }: { id: string }) {
 *   const blog = use(fetchData<Blog>(`/api/blog/${id}`))
 *   return <article>{blog.content}</article>
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With custom options
 * const blog = use(
 *   fetchData<Blog>(`/api/blog/${id}`, {
 *     cacheKey: `blog:${id}`,
 *     ttl: 60000, // 1 minute
 *     retry: { attempts: 3, delay: 1000 }
 *   })
 * )
 * ```
 */
export function fetchData<T = any>(
  url: string,
  options?: FetchOptions
): Promise<T> {
  const fullURL = resolveURL(url, options?.baseURL)
  const cacheKey = generateCacheKey(fullURL, options)

  // Check if request is already in-flight (deduplication)
  const inflight = inflightRequests.get(cacheKey)
  if (inflight) {
    return inflight
  }

  // Create new request
  const promise = fetchWithRetry<T>(fullURL, options).finally(() => {
    // Remove from in-flight map when done
    inflightRequests.delete(cacheKey)
  })

  // Store in in-flight map
  inflightRequests.set(cacheKey, promise)

  return promise
}

/**
 * Create a resource for fetching data
 *
 * This combines fetchData with resource management.
 * Use this when you want explicit control over the resource.
 *
 * @example
 * ```tsx
 * const blogResource = createFetchResource<Blog>(`/api/blog/${id}`)
 *
 * function BlogContent() {
 *   const blog = use(blogResource.promise)
 *   return <article>{blog.content}</article>
 * }
 * ```
 */
export function createFetchResource<T = any>(
  url: string,
  options?: FetchOptions
): Resource<T> {
  const fullURL = resolveURL(url, options?.baseURL)
  const cacheKey = generateCacheKey(fullURL, options)

  return createCachedResource<T>(
    cacheKey,
    () => fetchData<T>(url, options),
    { ttl: options?.ttl }
  )
}

/**
 * Prefetch data (useful for route preloading)
 *
 * Starts fetching data but doesn't wait for it to complete.
 * Useful for optimistic data loading (e.g., on link hover).
 *
 * @example
 * ```tsx
 * <Link
 *   to={`/blog/${id}`}
 *   onMouseEnter={() => prefetchData(`/api/blog/${id}`)}
 * >
 *   Read More
 * </Link>
 * ```
 */
export function prefetchData<T = any>(
  url: string,
  options?: FetchOptions
): void {
  const fullURL = resolveURL(url, options?.baseURL)
  const cacheKey = generateCacheKey(fullURL, options)

  preloadResource<T>(cacheKey, () => fetchData<T>(url, options), {
    ttl: options?.ttl,
  })
}

/**
 * Mutate data (invalidate cache after update)
 *
 * Use this after POST/PUT/DELETE requests to invalidate cached data.
 *
 * @example
 * ```tsx
 * async function updateBlog(id: string, data: Partial<Blog>) {
 *   await fetch(`/api/blog/${id}`, {
 *     method: 'PUT',
 *     body: JSON.stringify(data)
 *   })
 *
 *   // Invalidate cache to force refetch
 *   mutateData(`/api/blog/${id}`)
 * }
 * ```
 */
export function mutateData(url: string, options?: FetchOptions): void {
  const fullURL = resolveURL(url, options?.baseURL)
  const cacheKey = generateCacheKey(fullURL, options)
  invalidateResource(cacheKey)
}

/**
 * Create a data fetcher hook
 *
 * This is a factory function that creates reusable data fetchers.
 *
 * @example
 * ```tsx
 * // Create a blog fetcher
 * const fetchBlog = createDataFetcher<Blog>((id: string) => `/api/blog/${id}`)
 *
 * // Use in component
 * function BlogPost({ id }: { id: string }) {
 *   const blog = use(fetchBlog(id))
 *   return <article>{blog.content}</article>
 * }
 * ```
 */
export function createDataFetcher<T, Args extends any[] = []>(
  urlBuilder: (...args: Args) => string,
  defaultOptions?: FetchOptions
) {
  return (...args: Args): Promise<T> => {
    const url = urlBuilder(...args)
    return fetchData<T>(url, defaultOptions)
  }
}

/**
 * Mock data for development/testing
 *
 * Useful for testing components without a backend.
 *
 * @example
 * ```tsx
 * const mockBlog = mockData<Blog>({
 *   id: '123',
 *   title: 'Test Blog',
 *   content: 'Lorem ipsum...'
 * })
 *
 * function BlogPost() {
 *   const blog = use(mockBlog)
 *   return <article>{blog.content}</article>
 * }
 * ```
 */
export function mockData<T>(data: T, delay: number = 0): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay)
  })
}
