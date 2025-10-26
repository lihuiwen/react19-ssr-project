/**
 * Promise Resource Management System (Phase 4)
 *
 * Provides infrastructure for React 19's use() Hook:
 * - Server-side: Awaits promises during SSR
 * - Client-side: Reuses cached data or fetches new data
 *
 * @see https://react.dev/reference/react/use
 */

/**
 * Resource status states
 */
export type ResourceStatus = 'pending' | 'fulfilled' | 'rejected'

/**
 * Resource wrapper for promises that can be consumed by React's use() Hook
 */
export interface Resource<T> {
  /** Current status of the resource */
  status: ResourceStatus
  /** Resolved value (only available when status is 'fulfilled') */
  value?: T
  /** Rejection reason (only available when status is 'rejected') */
  reason?: any
  /** Original promise */
  promise: Promise<T>
}

/**
 * Cache entry for resources
 */
interface CacheEntry<T> {
  resource: Resource<T>
  timestamp: number
}

/**
 * Global resource cache (shared between client and server)
 */
const resourceCache = new Map<string, CacheEntry<any>>()

/**
 * Default cache TTL (5 minutes)
 */
const DEFAULT_CACHE_TTL = 5 * 60 * 1000

/**
 * Create a resource from a promise
 *
 * This function wraps a promise in a Resource object that tracks its status.
 * React's use() Hook can consume this resource and suspend rendering until
 * the promise resolves.
 *
 * @example
 * ```tsx
 * const blogResource = createResource(fetchBlog('123'))
 *
 * function BlogContent() {
 *   const blog = use(blogResource.promise)
 *   return <article>{blog.content}</article>
 * }
 * ```
 */
export function createResource<T>(promise: Promise<T>): Resource<T> {
  const resource: Resource<T> = {
    status: 'pending',
    promise,
  }

  promise.then(
    (value) => {
      resource.status = 'fulfilled'
      resource.value = value
    },
    (reason) => {
      resource.status = 'rejected'
      resource.reason = reason
    }
  )

  return resource
}

/**
 * Create a resource with caching support
 *
 * If a resource with the same cache key exists and is still valid,
 * returns the cached resource. Otherwise, creates a new resource.
 *
 * @param cacheKey - Unique identifier for this resource
 * @param fetcher - Function that returns a promise
 * @param options - Cache options
 *
 * @example
 * ```tsx
 * const blogResource = createCachedResource(
 *   'blog:123',
 *   () => fetchBlog('123'),
 *   { ttl: 60000 }
 * )
 * ```
 */
export function createCachedResource<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  options: { ttl?: number } = {}
): Resource<T> {
  const { ttl = DEFAULT_CACHE_TTL } = options
  const now = Date.now()

  // Check cache
  const cached = resourceCache.get(cacheKey)
  if (cached && now - cached.timestamp < ttl) {
    return cached.resource
  }

  // Create new resource
  const resource = createResource(fetcher())

  // Store in cache
  resourceCache.set(cacheKey, {
    resource,
    timestamp: now,
  })

  return resource
}

/**
 * Preload a resource (useful for prefetching)
 *
 * Creates a resource but doesn't wait for it to resolve.
 * Useful for starting data fetches early (e.g., on hover, on route change).
 *
 * @example
 * ```tsx
 * // Start fetching on hover
 * <Link
 *   to="/blog/123"
 *   onMouseEnter={() => preloadResource('blog:123', () => fetchBlog('123'))}
 * >
 *   View Blog
 * </Link>
 * ```
 */
export function preloadResource<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  options?: { ttl?: number }
): void {
  createCachedResource(cacheKey, fetcher, options)
}

/**
 * Get a resource from cache
 *
 * Returns the cached resource if it exists and is valid, otherwise null.
 */
export function getCachedResource<T>(cacheKey: string): Resource<T> | null {
  const cached = resourceCache.get(cacheKey)
  if (!cached) return null

  return cached.resource
}

/**
 * Invalidate a cached resource
 *
 * Forces the next fetch to create a new resource.
 *
 * @example
 * ```tsx
 * // After updating a blog post
 * await updateBlog('123', data)
 * invalidateResource('blog:123')
 * ```
 */
export function invalidateResource(cacheKey: string): void {
  resourceCache.delete(cacheKey)
}

/**
 * Clear all cached resources
 *
 * Useful for testing or when logging out a user.
 */
export function clearResourceCache(): void {
  resourceCache.clear()
}

/**
 * Create a resource from initial data (server-side hydration)
 *
 * Used during SSR to create a resource that is already fulfilled.
 * The client can then reuse this data without refetching.
 *
 * @example
 * ```tsx
 * // Server-side
 * const blogData = await fetchBlog('123')
 * const resource = createResourceFromData(blogData)
 *
 * // Serialize to HTML
 * window.__INITIAL_DATA__ = { 'blog:123': blogData }
 *
 * // Client-side
 * const initialData = window.__INITIAL_DATA__
 * const resource = createResourceFromData(initialData['blog:123'])
 * ```
 */
export function createResourceFromData<T>(data: T): Resource<T> {
  return {
    status: 'fulfilled',
    value: data,
    promise: Promise.resolve(data),
  }
}

/**
 * Create a resource from an error (for error states)
 */
export function createResourceFromError<T = never>(error: any): Resource<T> {
  return {
    status: 'rejected',
    reason: error,
    promise: Promise.reject(error),
  }
}

/**
 * Check if running on server
 */
export function isServer(): boolean {
  return typeof window === 'undefined'
}

/**
 * Serialize resource data for SSR
 *
 * Extracts the fulfilled value from resources to be sent to the client.
 * Only serializes fulfilled resources; pending/rejected are excluded.
 *
 * @returns Object mapping cache keys to their values
 */
export function serializeResources(): Record<string, any> {
  const serialized: Record<string, any> = {}

  for (const [key, entry] of resourceCache.entries()) {
    if (entry.resource.status === 'fulfilled') {
      serialized[key] = entry.resource.value
    }
  }

  return serialized
}

/**
 * Hydrate resources from serialized data (client-side)
 *
 * Restores resources from server-sent data during hydration.
 * This prevents duplicate fetches on the client.
 *
 * @param data - Serialized resource data from server
 */
export function hydrateResources(data: Record<string, any>): void {
  for (const [key, value] of Object.entries(data)) {
    const resource = createResourceFromData(value)
    resourceCache.set(key, {
      resource,
      timestamp: Date.now(),
    })
  }
}
