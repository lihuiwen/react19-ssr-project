/**
 * Koa Server with SSR (Phase 3 - API Routes)
 * HTTP server with server-side rendering and API routes
 */

import Koa from 'koa'
import serve from 'koa-static'
import bodyParser from 'koa-bodyparser'
import path from 'path'
import { createContextMiddleware } from '../runtime/server/middleware/context'
import { renderPageWithRouter } from '../runtime/server/render'
import { loadRoutes, RouteObject } from '../build/route-scanner'
import { loadApiRoutes } from '../build/api-scanner'
import { createApiHandler } from '../runtime/server/api-handler'
import type { ApiRoute } from '../build/api-scanner'
import React from 'react'

const app = new Koa()

// Configuration
const PORT = process.env.PORT || 3000
const STATIC_DIR = path.resolve(__dirname, '../../dist/client')
const PAGES_DIR = path.resolve(__dirname, '../../examples/basic/pages')
const API_DIR = path.resolve(__dirname, '../../examples/basic/pages/api')
const ROUTES_JSON = path.resolve(__dirname, '../../dist/.routes.json')
const API_ROUTES_JSON = path.resolve(__dirname, '../../dist/.api-routes.json')

// Load page routes
let routes: RouteObject[] = []

try {
  const routesData = loadRoutes(ROUTES_JSON)
  routes = routesData.routes
  console.log(`[Server] Loaded ${routes.length} page routes (React Router format)`)
  routes.forEach((route) => {
    const routePath = route.index ? '/ (index)' : route.path
    console.log(`  - ${routePath}`)
  })
} catch (error) {
  console.error('[Server] Failed to load routes:', error)
  console.log('[Server] Using fallback empty routes')
  routes = []
}

// Load API routes
let apiRoutes: ApiRoute[] = []

try {
  const apiRoutesData = loadApiRoutes(API_ROUTES_JSON)
  apiRoutes = apiRoutesData.routes

  if (apiRoutes.length > 0) {
    console.log(`[Server] Loaded ${apiRoutes.length} API routes`)
    apiRoutes.forEach((route) => {
      const params = route.params && route.params.length > 0
        ? ` (params: ${route.params.join(', ')})`
        : ''
      console.log(`  - ${route.path}${params}`)
    })
  }
} catch (error) {
  console.log('[Server] No API routes found (this is normal if pages/api/ doesn\'t exist yet)')
  apiRoutes = []
}

/**
 * Setup middleware stack
 */

// 1. Context middleware (MUST be first - injects security, trace, etc.)
app.use(createContextMiddleware())

// 2. Body parser for JSON requests (before API handler)
app.use(bodyParser({
  enableTypes: ['json', 'form'],
  jsonLimit: '10mb',
  formLimit: '10mb',
}))

// 3. Static file serving
app.use(serve(STATIC_DIR, {
  maxage: process.env.NODE_ENV === 'production' ? 31536000000 : 0,
}))

// 4. API routes handler
if (apiRoutes.length > 0) {
  app.use(createApiHandler(apiRoutes, API_DIR))
}

// 5. Error handling middleware
app.use(async (ctx, next) => {
  try {
    await next()
  } catch (error) {
    console.error('[Server] Error:', error)
    ctx.status = 500
    ctx.body = 'Internal Server Error'
  }
})

// 4. Routing + SSR middleware (Phase 2.5 - React Router)
app.use(async (ctx) => {
  // Skip non-HTML requests (static files, API routes, etc.)
  const isStaticFile = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/.test(ctx.path)
  if (isStaticFile) {
    return
  }

  try {
    // Render page with React Router
    const result = await renderPageWithRouter(ctx, routes, PAGES_DIR)

    ctx.status = result.status
    ctx.type = 'text/html'
    ctx.body = result.html
  } catch (error: any) {
    console.error('[SSR] Render error:', error)

    // Check if it's a 404 error
    if (error.status === 404 || error.message?.includes('404')) {
      ctx.status = 404
      ctx.body = generate404Page()
    } else {
      ctx.status = 500
      ctx.body = generate500Page(error)
    }
  }
})

/**
 * Generate 404 page
 */
function generate404Page(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>404 - Page Not Found</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
      text-align: center;
    }
    h1 { font-size: 3rem; margin-bottom: 1rem; }
    a {
      display: inline-block;
      margin-top: 2rem;
      padding: 0.75rem 1.5rem;
      background: #3b82f6;
      color: white;
      text-decoration: none;
      border-radius: 0.5rem;
    }
    a:hover { background: #2563eb; }
  </style>
</head>
<body>
  <h1>404</h1>
  <p>Page not found</p>
  <a href="/">Go back home</a>
</body>
</html>`
}

/**
 * Generate 500 error page
 */
function generate500Page(error: any): string {
  const isDev = process.env.NODE_ENV !== 'production'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>500 - Server Error</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
    }
    h1 { color: #dc2626; }
    pre {
      background: #1f2937;
      color: #f3f4f6;
      padding: 1rem;
      border-radius: 0.5rem;
      overflow-x: auto;
    }
  </style>
</head>
<body>
  <h1>500 - Server Error</h1>
  <p>An error occurred while rendering the page.</p>
  ${isDev ? `<pre>${error.stack || error.message}</pre>` : ''}
</body>
</html>`
}

/**
 * Start the server
 */
export function startServer() {
  const server = app.listen(PORT, () => {
    console.log('\n🚀 React 19 SSR Framework')
    console.log('━'.repeat(50))
    console.log(`📡 Server running at: http://localhost:${PORT}`)
    console.log(`📂 Static files: ${STATIC_DIR}`)
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`)
    console.log('━'.repeat(50))
    console.log('\nPress Ctrl+C to stop\n')
  })

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('\n[Server] Shutting down gracefully...')
    server.close(() => {
      console.log('[Server] Closed')
      process.exit(0)
    })
  })

  return server
}

// Start server if this file is executed directly
if (require.main === module) {
  startServer()
}

export default app
