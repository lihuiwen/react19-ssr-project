/**
 * Unified Streaming Adapter (Phase 3)
 * Automatically detects runtime and selects appropriate streaming method
 */

import type { Context } from 'koa'
import { renderToNodeStream, type NodeStreamOptions } from './node'
import { renderToWebStream, type WebStreamOptions } from './web'

export type Runtime = 'auto' | 'node' | 'edge'

export interface StreamingOptions {
  runtime?: Runtime
  bootstrapScripts?: string[]
  nonce?: string
  onShellReady?: () => void
  onShellError?: (error: Error) => void
  onAllReady?: () => void
  onError?: (error: Error) => void
  signal?: AbortSignal
}

/**
 * Detect current runtime environment
 */
export function detectRuntime(): 'node' | 'edge' {
  // Check for Edge Runtime indicators
  if (
    // @ts-ignore
    typeof EdgeRuntime !== 'undefined' ||
    // @ts-ignore
    typeof Deno !== 'undefined' ||
    // @ts-ignore
    typeof Bun !== 'undefined'
  ) {
    return 'edge'
  }

  // Default to Node.js
  return 'node'
}

/**
 * Render React app with streaming - automatically selects runtime
 */
export async function renderStream(
  app: React.ReactElement,
  ctx: Context,
  options: StreamingOptions = {}
): Promise<void> {
  const { runtime = 'auto', ...streamOptions } = options

  // Determine actual runtime
  const actualRuntime = runtime === 'auto' ? detectRuntime() : runtime

  console.log(`[SSR] Using ${actualRuntime} streaming renderer`)

  if (actualRuntime === 'node') {
    // Use Node.js renderToPipeableStream
    const nodeOptions: NodeStreamOptions = {
      bootstrapScripts: streamOptions.bootstrapScripts,
      nonce: streamOptions.nonce,
      onShellReady: streamOptions.onShellReady,
      onShellError: streamOptions.onShellError,
      onAllReady: streamOptions.onAllReady,
      onError: streamOptions.onError,
    }

    return renderToNodeStream(app, ctx, nodeOptions)
  } else {
    // Use Edge runtime renderToReadableStream
    const webOptions: WebStreamOptions = {
      bootstrapScripts: streamOptions.bootstrapScripts,
      nonce: streamOptions.nonce,
      signal: streamOptions.signal,
      onError: streamOptions.onError,
    }

    return renderToWebStream(app, ctx, webOptions)
  }
}

/**
 * Get streaming configuration from environment
 */
export function getStreamingConfig(): StreamingOptions {
  const config: StreamingOptions = {
    runtime: (process.env.SSR_RUNTIME as Runtime) || 'auto',
    bootstrapScripts: ['/client.js'],
  }

  return config
}
