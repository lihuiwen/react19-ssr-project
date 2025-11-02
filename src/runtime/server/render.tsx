/**
 * Server-Side Rendering Engine (Phase 3 - Streaming SSR)
 */

import React from 'react'
import { createStaticHandler, createStaticRouter } from 'react-router-dom/server'
import { StaticRouterProvider } from 'react-router-dom/server'
import type { Context } from 'koa'
import { injectScript, sanitizeJSON } from './security'
import { ResponseHeaders } from './headers'
import { renderStream, getStreamingConfig } from './streaming/adapter'
import { serializeResources } from '../shared/resource'
import { RequestContext } from 'types/framework'
import { ErrorBoundary } from '../shared/error-boundary'

const isDev = process.env.NODE_ENV !== 'production'

/**
 * Load webpack manifest.json
 * In development, falls back to default paths
 */
function loadManifest(): Record<string, string> {
  try {
    const fs = require('fs')
    const path = require('path')

    // Resolve manifest path relative to the server dist directory
    // In production: dist/server/server.js -> ../client/manifest.json -> dist/client/manifest.json
    const manifestPath = path.resolve(__dirname, isDev ? '../../../dist/client/manifest.json' : '../client/manifest.json')
    const manifestContent = fs.readFileSync(manifestPath, 'utf-8')
    const manifest = JSON.parse(manifestContent)

    return manifest
  } catch (error) {
    // Development fallback - return all bundles
    return {
      'client.js': '/client.js',
      'client.css': '/client.css',
      'react.js': '/react.js',
      'vendors.js': '/vendors.js',
    }
  }
}

/**
 * Generate error page HTML
 */
function generateErrorHTML(error: any, nonce: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Server Error</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .error-box {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 { color: #e53e3e; margin-top: 0; }
    pre {
      background: #2d3748;
      color: #f7fafc;
      padding: 15px;
      border-radius: 4px;
      overflow-x: auto;
    }
  </style>
</head>
<body>
  <div class="error-box">
    <h1>⚠️ Server Error</h1>
    <p>An error occurred while rendering the page.</p>
    ${
      isDev
        ? `
    <h2>Error Details:</h2>
    <pre>${error.stack || error.message}</pre>
    `
        : ''
    }
  </div>
</body>
</html>`
}

/**
 * Enhance route objects with lazy-loaded component references
 */
async function enhanceRoutesWithComponents(routeObjects: any[], pagesDir: string): Promise<any[]> {
  // Import page loader (contains all pre-loaded components)
  const { getPageComponent } = require('./page-loader')

  return routeObjects.map((route) => {
    const { filePath, ...rest } = route

    if (!filePath) {
      return rest
    }

    // Get component from pre-loaded registry
    const Component = () => {
      try {
        const PageComponent = getPageComponent(filePath, pagesDir)
        return React.createElement(PageComponent)
      } catch (error) {
        console.error(`[SSR] Failed to load component: ${filePath}`, error)
        throw error
      }
    }

    // Wrap component with ErrorBoundary (Phase 7)
    return {
      ...rest,
      element: (
        <ErrorBoundary
          onError={(error, errorInfo) => {
            console.error(`[Route Error] ${route.path || route.id}`, error, errorInfo)
          }}
        >
          <Component />
        </ErrorBoundary>
      ),
    }
  })
}

/**
 * Render page with React Router and Streaming SSR (Phase 3)
 * Uses createStaticHandler/createStaticRouter + renderStream
 */
export async function renderPageWithRouterStreaming(
  ctx: Context,
  routeObjects: any[],
  pagesDir: string,
): Promise<void> {
  const startTime = Date.now()

  try {
    // Mark render start
    ctx.trace.marks.set('renderStart', Date.now() - ctx.trace.startTime)

    // Convert RouteObjects to include lazy-loaded components
    const routes = await enhanceRoutesWithComponents(routeObjects, pagesDir)

    // Create static handler for data fetching and route matching
    const { query } = createStaticHandler(routes)

    // Create a fetch Request from Koa context
    const request = new Request(`http://localhost${ctx.url}`, {
      method: ctx.method,
      headers: new Headers(ctx.headers as any),
    })

    // Query the routes with the request
    const context = await query(request)

    // Check if context is a Response (redirect or error)
    if (context instanceof Response) {
      const status = context.status

      if (status === 404) {
        // Set 404 status and let error handler middleware render the page
        ctx.status = 404
        return
      }

      if (status >= 300 && status < 400) {
        // Handle redirects
        const location = context.headers.get('Location')
        ctx.redirect(location || '/')
        return
      }

      throw new Error(`Unexpected response status: ${status}`)
    }

    // Check for errors in the router context
    const hasErrors = context.errors && Object.keys(context.errors).length > 0
    if (hasErrors) {
      const firstError = Object.values(context.errors)[0]

      // Check if it's a 404 error
      if (firstError && typeof firstError === 'object' && 'status' in firstError && firstError.status === 404) {
        ctx.status = 404
        return
      }

      // Other errors - throw to be caught by error handler
      console.error('[SSR] Router context has errors:', context.errors)
      throw new Error('Router error: ' + JSON.stringify(context.errors))
    }

    // Create static router with the context
    const router = createStaticRouter(routes, context)

    // Load manifest for bootstrap scripts
    const manifest = loadManifest()

    const jsBundles = [
      manifest['react.js'],
      manifest['vendors.js'],
      manifest['client.js'] || '/client.js',
    ].filter(Boolean)

    // Get streaming configuration
    const streamingConfig = getStreamingConfig()

    // Serialize resources from cache (Phase 4)
    const resources = serializeResources()

    // Prepare initial data (include routes and resources for client-side hydration)
    const initialData = {
      routes: routeObjects,
      resources, // Add serialized resources
    }

    // Create app with HTML shell
    // Note: Scripts are NOT included in JSX - they're added via bootstrapScripts option
    const app = (
      <html lang="en">
        <head>
          <meta charSet="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>React 19 SSR Framework</title>
          <link rel="stylesheet" href={manifest['client.css'] || '/client.css'} />
        </head>
        <body>
          <div id="root">
            <StaticRouterProvider router={router} context={context} />
          </div>
          <script
            nonce={ctx.security.nonce}
            dangerouslySetInnerHTML={{
              __html: `window.__INITIAL_DATA__ = ${sanitizeJSON(initialData)}`,
            }}
          />
        </body>
      </html>
    )

    // Set response mode
    ctx.responseMode = 'stream'

    const header = new ResponseHeaders(ctx as RequestContext)
    header.applyAll()

    // Stream the response with callbacks
    await renderStream(app, ctx, {
      ...streamingConfig,
      bootstrapScripts: jsBundles,
      nonce: ctx.security.nonce,

      onShellReady: () => {
        // Mark when shell is ready
        ctx.trace.marks.set('shellReady', Date.now() - ctx.trace.startTime)
        console.log(`[SSR] Shell ready in ${Date.now() - startTime}ms - ${ctx.url}`)
      },

      onAllReady: () => {
        // Mark when all content is ready (including Suspense boundaries)
        ctx.trace.marks.set('allReady', Date.now() - ctx.trace.startTime)
        console.log(`[SSR] All content ready in ${Date.now() - startTime}ms - ${ctx.url}`)
      },

      onError: (error: Error) => {
        console.error('[SSR] Streaming error:', error)
      },
    })

    console.log(`[SSR] Streamed with React Router in ${Date.now() - startTime}ms - ${ctx.url}`)
  } catch (error: any) {
    console.error('[SSR] Render error:', error)

    // Check for 404
    if (error.message?.includes('404')) {
      throw error // Re-throw to be handled by server.ts
    }

    // Send error response
    ctx.status = 500
    ctx.type = 'text/html'
    ctx.body = generateErrorHTML(error, ctx.security.nonce)
  }
}
