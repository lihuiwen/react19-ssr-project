/**
 * Node.js Streaming Adapter (Phase 3)
 * Uses renderToPipeableStream for Node.js runtime
 */

import { renderToPipeableStream } from 'react-dom/server'
import type { Context } from 'koa'
import { Writable } from 'stream'

export interface NodeStreamOptions {
  bootstrapScripts?: string[]
  nonce?: string
  onShellReady?: () => void
  onShellError?: (error: Error) => void
  onAllReady?: () => void
  onError?: (error: Error) => void
}

/**
 * Render React app to Node.js stream
 */
export function renderToNodeStream(
  app: React.ReactElement,
  ctx: Context,
  options: NodeStreamOptions = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    const {
      bootstrapScripts = ['/client.js'],
      nonce,
      onShellReady,
      onShellError,
      onAllReady,
      onError,
    } = options

    let didError = false

    const { pipe, abort } = renderToPipeableStream(app, {
      bootstrapScripts,
      nonce,

      onShellReady() {
        // Shell is ready - send initial HTML
        ctx.status = didError ? 500 : 200
        ctx.type = 'text/html'
        ctx.set('Transfer-Encoding', 'chunked')

        // Create a writable stream that writes to Koa response
        const stream = new Writable({
          write(chunk, encoding, callback) {
            ctx.res.write(chunk, encoding, callback)
          },
          final(callback) {
            ctx.res.end(callback)
            resolve()
          },
        })

        pipe(stream)

        if (onShellReady) {
          onShellReady()
        }
      },

      onShellError(error: Error) {
        didError = true

        // Log error
        console.error('[SSR] Shell render error:', error)

        // Send error response
        ctx.status = 500
        ctx.type = 'text/html'
        ctx.body = `<!DOCTYPE html>
<html>
<head>
  <title>Error</title>
</head>
<body>
  <h1>Server Error</h1>
  <p>Failed to render the page.</p>
  ${process.env.NODE_ENV !== 'production' ? `<pre>${error.stack}</pre>` : ''}
</body>
</html>`

        if (onShellError) {
          onShellError(error)
        }

        reject(error)
      },

      onAllReady() {
        // All content is ready (including Suspense boundaries)
        if (onAllReady) {
          onAllReady()
        }
      },

      onError(error: Error) {
        didError = true
        console.error('[SSR] Render error:', error)

        if (onError) {
          onError(error)
        }
      },
    })

    // Handle request abortion
    ctx.req.on('close', () => {
      abort()
    })
  })
}
