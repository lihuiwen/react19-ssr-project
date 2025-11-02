/**
 * Koa Server with SSR (Phase 3 - Streaming SSR)
 * HTTP server with server-side rendering using React Router v6 + streaming
 */

import Koa from 'koa'
import serve from 'koa-static'
import path from 'path'
import { createContextMiddleware } from '../runtime/server/middleware/context'
import { createErrorHandlerMiddleware } from '../runtime/server/middleware/error-handler'
import { renderPageWithRouterStreaming } from '../runtime/server/render'
import { loadRoutes, RouteObject } from '../build/route-scanner'
import React from 'react'

const app = new Koa()

// Configuration
const PORT = process.env.PORT || 3000
// In production: dist/server/server.js -> ../client -> dist/client
const STATIC_DIR = path.resolve(__dirname, '../client')
const PAGES_DIR = path.resolve(__dirname, '../../examples/basic/pages')
const ROUTES_JSON = path.resolve(__dirname, '../.routes.json')

// Load routes
let routes: RouteObject[] = []

try {
  const routesData = loadRoutes(ROUTES_JSON)
  routes = routesData.routes
  console.log(`[Server] Loaded ${routes.length} routes (React Router format)`)
  routes.forEach((route) => {
    const routePath = route.index ? '/ (index)' : route.path
    console.log(`  - ${routePath}`)
  })
} catch (error) {
  console.error('[Server] Failed to load routes:', error)
  console.log('[Server] Using fallback empty routes')
  routes = []
}

/**
 * Setup middleware stack
 */

// 1. Error handling middleware (MUST be first to catch all errors)
app.use(createErrorHandlerMiddleware())

// 2. Context middleware (injects security, trace, etc.)
app.use(createContextMiddleware())

// 3. Static file serving
app.use(serve(STATIC_DIR, {
  maxage: process.env.NODE_ENV === 'production' ? 31536000000 : 0,
}))

// 4. Routing + SSR middleware (Phase 3 - Streaming SSR)
app.use(async (ctx) => {
  // Skip non-HTML requests (static files, API routes, etc.)
  const isStaticFile = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/.test(ctx.path)
  if (isStaticFile) {
    return
  }

  // Use streaming SSR (Phase 3)
  // Errors are caught by the error handler middleware
  await renderPageWithRouterStreaming(ctx, routes, PAGES_DIR)
  // Response is handled by streaming - no need to set ctx.body
})

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
