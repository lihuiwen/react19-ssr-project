/**
 * API Handler (Phase 3)
 * Handles API route requests with method routing and parameter extraction
 */

import type { Context, Next } from 'koa'
import type { ApiRoute } from '../../build/api-scanner'

/**
 * API Handler function type
 * Supports both default export and named method exports
 */
export type ApiHandler = (ctx: Context) => Promise<void> | void

export interface ApiHandlerModule {
  default?: ApiHandler
  GET?: ApiHandler
  POST?: ApiHandler
  PUT?: ApiHandler
  PATCH?: ApiHandler
  DELETE?: ApiHandler
  OPTIONS?: ApiHandler
  HEAD?: ApiHandler
}

/**
 * Match API route and extract parameters
 */
export function matchApiRoute(
  url: string,
  routes: ApiRoute[],
): { route: ApiRoute; params: Record<string, string> } | null {
  // Parse URL to get pathname (remove query string)
  const pathname = url.split('?')[0]

  for (const route of routes) {
    const params = matchPath(pathname, route.path)
    if (params !== null) {
      return { route, params }
    }
  }

  return null
}

/**
 * Match a pathname against a route pattern
 * Returns params object if matched, null otherwise
 */
function matchPath(pathname: string, pattern: string): Record<string, string> | null {
  // Convert route pattern to regex
  // e.g., /api/posts/:id -> /^\/api\/posts\/([^/]+)$/
  const paramNames: string[] = []
  const regexPattern = pattern.replace(/:([^/]+)/g, (_, paramName) => {
    paramNames.push(paramName)
    return '([^/]+)'
  })

  const regex = new RegExp(`^${regexPattern}$`)
  const match = pathname.match(regex)

  if (!match) {
    return null
  }

  // Extract params
  const params: Record<string, string> = {}
  paramNames.forEach((name, index) => {
    params[name] = match[index + 1]
  })

  return params
}

/**
 * Create API handler middleware
 */
export function createApiHandler(
  routes: ApiRoute[],
  apiDir: string,
): (ctx: Context, next: Next) => Promise<void> {
  return async (ctx: Context, next: Next) => {
    // Only handle paths starting with /api/
    if (!ctx.path.startsWith('/api/')) {
      return next()
    }

    try {
      // Match API route
      const match = matchApiRoute(ctx.url, routes)

      if (!match) {
        // No API route matched, continue to next middleware
        return next()
      }

      // Load API handler module
      const handlerModule = loadApiHandler(match.route.filePath, apiDir)

      // Set route params in context
      ctx.params = match.params

      // Parse query parameters
      const url = new URL(ctx.url, `http://${ctx.host}`)
      ctx.query = Object.fromEntries(url.searchParams.entries())

      // Get handler for current HTTP method
      const method = ctx.method.toUpperCase()
      let handler: ApiHandler | undefined

      // Try to get method-specific handler first
      if (method in handlerModule && typeof handlerModule[method as keyof ApiHandlerModule] === 'function') {
        handler = handlerModule[method as keyof ApiHandlerModule] as ApiHandler
      } else if (handlerModule.default) {
        // Fall back to default export
        handler = handlerModule.default
      }

      if (!handler) {
        // Method not supported
        ctx.status = 405
        ctx.body = {
          error: 'Method Not Allowed',
          message: `HTTP method ${method} is not supported for this route`,
          allowedMethods: Object.keys(handlerModule).filter(k => k !== 'default'),
        }
        return
      }

      // Execute handler
      await handler(ctx)

      // If handler didn't set a response, default to 200
      if (!ctx.body && ctx.status === 404) {
        ctx.status = 200
      }
    } catch (error: any) {
      console.error('[API] Handler error:', error)

      // Return error response
      ctx.status = error.status || 500
      ctx.body = {
        error: ctx.status === 500 ? 'Internal Server Error' : error.message,
        message: process.env.NODE_ENV === 'production'
          ? 'An error occurred processing your request'
          : error.stack || error.message,
      }
    }
  }
}

/**
 * Load API handler from file
 */
function loadApiHandler(filePath: string, apiDir: string): ApiHandlerModule {
  const path = require('path')
  const fullPath = path.resolve(apiDir, filePath)

  try {
    // Clear require cache in development for HMR
    if (process.env.NODE_ENV !== 'production') {
      delete require.cache[require.resolve(fullPath)]
    }

    const module = require(fullPath)
    return module
  } catch (error) {
    console.error(`[API] Failed to load handler: ${fullPath}`, error)
    throw new Error(`API handler not found: ${filePath}`)
  }
}

/**
 * Parse JSON body middleware
 * Automatically parses JSON request bodies
 */
export async function parseJsonBody(ctx: Context, next: Next): Promise<void> {
  if (ctx.is('json')) {
    try {
      // Koa already parses body if koa-bodyparser is installed
      // This is a placeholder for custom body parsing logic if needed
      await next()
    } catch (error) {
      ctx.status = 400
      ctx.body = {
        error: 'Bad Request',
        message: 'Invalid JSON in request body',
      }
    }
  } else {
    await next()
  }
}
