/**
 * SSR Development Server (Port 3000)
 * Responsible for:
 * - Server-side rendering
 * - Serving static files from dist/
 * - Clearing require cache for hot server-side code updates
 * - Graceful shutdown to avoid port conflicts
 */

// Register ts-node for loading TypeScript files
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
  },
})

const Koa = require('koa')
const serve = require('koa-static')
const path = require('path')

const app = new Koa()
const PORT = process.env.PORT || 3000

// Paths
const DIST_CLIENT = path.resolve(__dirname, '../../dist/client')

// Serve static files
app.use(serve(DIST_CLIENT, {
  maxage: 0, // No caching in development
}))

// SSR rendering middleware
app.use(async (ctx) => {
  // Skip static file requests
  const isStaticFile = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json|map)$/.test(ctx.path)
  if (isStaticFile) {
    return
  }

  // Clear require cache to get latest server-side code
  // This enables server-side hot reload without restarting
  Object.keys(require.cache).forEach((key) => {
    // Clear everything except node_modules
    if (!key.includes('node_modules')) {
      delete require.cache[key]
    }
  })

  try {
    // Dynamically load the server module to get latest code
    const { createContextMiddleware } = require('../runtime/server/middleware/context')
    const { renderPageWithRouterStreaming } = require('../runtime/server/render')
    const { loadRoutes } = require('../build/route-scanner')

    const ROUTES_JSON = path.resolve(__dirname, '../../dist/.routes.json')
    const PAGES_DIR = path.resolve(__dirname, '../../examples/basic/pages')

    // Load routes
    const routesData = loadRoutes(ROUTES_JSON)
    const routes = routesData.routes

    // Apply context middleware
    const contextMiddleware = createContextMiddleware()
    await contextMiddleware(ctx, async () => {
      try {
        // Use streaming SSR
        await renderPageWithRouterStreaming(ctx, routes, PAGES_DIR)
      } catch (error) {
        console.error('[SSR] Render error:', error)

        // Generate error page
        ctx.status = error.status === 404 ? 404 : 500
        ctx.type = 'text/html'
        ctx.body = generateErrorPage(error, ctx.status)
      }
    })
  } catch (error) {
    console.error('❌ SSR Error:', error)

    ctx.status = 500
    ctx.type = 'text/html'
    ctx.body = generateErrorPage(error, 500)
  }
})

function generateErrorPage(error, status) {
  const isDev = process.env.NODE_ENV !== 'production'

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${status} - ${status === 404 ? 'Not Found' : 'Server Error'}</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
    }
    h1 { color: ${status === 404 ? '#3b82f6' : '#dc2626'}; }
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
  <h1>${status} - ${status === 404 ? 'Page Not Found' : 'Server Error'}</h1>
  <p>${status === 404 ? 'The requested page does not exist.' : 'An error occurred while rendering the page.'}</p>
  ${isDev ? `<pre>${error.stack || error.message}</pre>` : ''}
  ${status === 404 ? '<a href="/">Go back home</a>' : ''}
</body>
</html>`
}

// Start server
const server = app.listen(PORT, () => {
  console.log(`\n🚀 SSR server running on http://localhost:${PORT}`)
  console.log(`   - Static files from: ${DIST_CLIENT}`)
  console.log(`   - Require cache clearing: enabled`)
  console.log(`   - Ready to handle SSR requests\n`)
})

/**
 * Graceful shutdown - crucial for nodemon restarts
 * This ensures the port is properly released before restarting
 */
process.on('SIGTERM', () => {
  console.log('\n🔄 SSR server restarting...')
  server.close(() => {
    console.log('✅ SSR server closed gracefully')
    // Add small delay to ensure port is fully released
    setTimeout(() => {
      process.exit(0)
    }, 100)
  })

  // Force exit after 2 seconds if graceful shutdown hangs
  setTimeout(() => {
    console.error('⚠️  Force closing SSR server (timeout)')
    process.exit(0)
  }, 2000)
})

process.on('SIGINT', () => {
  console.log('\n👋 SSR server shutting down...')
  server.close(() => {
    console.log('✅ SSR server closed')
    setTimeout(() => {
      process.exit(0)
    }, 100)
  })

  // Force exit after 2 seconds if graceful shutdown hangs
  setTimeout(() => {
    console.error('⚠️  Force closing SSR server (timeout)')
    process.exit(0)
  }, 2000)
})

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error)
  server.close(() => {
    process.exit(1)
  })
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled rejection at:', promise, 'reason:', reason)
})
