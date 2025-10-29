/**
 * Edge Runtime Streaming Adapter (Phase 3)
 * Uses renderToReadableStream for Edge/Cloudflare Workers/Deno Deploy
 */

import { renderToReadableStream } from 'react-dom/server'
import type { Context } from 'koa'

export interface WebStreamOptions {
  bootstrapScripts?: string[]
  nonce?: string
  signal?: AbortSignal
  onError?: (error: Error) => void
}

/**
 * Render React app to Web ReadableStream
 */
export async function renderToWebStream(
  app: React.ReactElement,
  ctx: Context,
  options: WebStreamOptions = {}
): Promise<void> {
  const {
    bootstrapScripts = ['/client.js'],
    nonce,
    signal,
    onError,
  } = options

  try {
    const stream = await renderToReadableStream(app, {
      bootstrapScripts,
      nonce,
      signal: signal || ctx.req.signal,
      onError(error: Error) {
        console.error('[SSR] Render error:', error)
        if (onError) {
          onError(error)
        }
      },
    })

    // Wait for shell to be ready
    await stream.allReady

    // Set headers
    ctx.status = 200
    ctx.type = 'text/html'

    // Convert ReadableStream to Node.js readable stream for Koa
    const reader = stream.getReader()
    const nodeStream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              controller.close()
              break
            }
            controller.enqueue(value)
          }
        } catch (error) {
          controller.error(error)
        }
      },
    })

    // Pipe to response
    ctx.body = nodeStream as any
  } catch (error: any) {
    console.error('[SSR] Stream render error:', error)

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
  }
}
