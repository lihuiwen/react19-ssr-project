/**
 * Koa Server with SSR (Phase 1)
 * Basic HTTP server with server-side rendering
 */

import Koa from 'koa'
import serve from 'koa-static'
import path from 'path'
import { createContextMiddleware } from '../runtime/server/middleware/context'
import { renderPage } from '../runtime/server/render'

// Import the example App component
// This will be dynamically imported in production
const App = require('../../examples/basic/pages/App').default

const app = new Koa()

// Configuration
const PORT = process.env.PORT || 3000
const STATIC_DIR = path.resolve(__dirname, '../../dist/client')

/**
 * Setup middleware stack
 */

// 1. Context middleware (MUST be first - injects security, trace, etc.)
app.use(createContextMiddleware())

// 2. Static file serving
app.use(serve(STATIC_DIR, {
  maxage: process.env.NODE_ENV === 'production' ? 31536000000 : 0,
}))

// 3. Error handling middleware
app.use(async (ctx, next) => {
  try {
    await next()
  } catch (error) {
    console.error('[Server] Error:', error)
    ctx.status = 500
    ctx.body = 'Internal Server Error'
  }
})

// 4. SSR middleware
app.use(async (ctx) => {
  // Only handle HTML requests
  if (ctx.path !== '/' && !ctx.path.startsWith('/page')) {
    return
  }

  try {
    const result = await renderPage(ctx, {
      url: ctx.url,
      App,
    })

    ctx.status = result.status
    ctx.type = 'text/html'
    ctx.body = result.html
  } catch (error) {
    console.error('[SSR] Render error:', error)
    ctx.status = 500
    ctx.body = 'Server error'
  }
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
