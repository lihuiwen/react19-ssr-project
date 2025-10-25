/**
 * Server-Side Rendering Engine (Phase 1)
 * Basic SSR using renderToString
 */

import React from 'react'
import { renderToString } from 'react-dom/server'
import type { Context } from 'koa'
import { injectScript } from './security'
import { ResponseHeaders } from './headers'

export interface RenderOptions {
  /** URL being rendered */
  url: string
  /** App component to render */
  App: React.ComponentType<any>
  /** Props to pass to the App component */
  props?: any
  /** Additional data to serialize to client */
  initialData?: any
}

export interface RenderResult {
  html: string
  status: number
}

/**
 * Generate complete HTML document with SSR content
 */
export function generateHTML(options: {
  appHtml: string
  initialData?: any
  nonce: string
  manifest: Record<string, string>
}): string {
  const { appHtml, initialData, nonce, manifest } = options

  // Get CSS assets
  const clientCss = manifest['client.css'] || '/client.css'

  // Get all JS bundles in the correct order
  // Order: react.js → vendors.js → client.js
  const jsBundles = [
    manifest['react.js'],
    manifest['vendors.js'],
    manifest['client.js'] || '/client.js',
  ].filter(Boolean) // Remove undefined values

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>React 19 SSR Framework</title>
  <link rel="stylesheet" href="${clientCss}">
</head>
<body>
  <div id="root">${appHtml}</div>
  ${
    initialData
      ? injectScript(`window.__INITIAL_DATA__ = ${JSON.stringify(initialData)}`, { nonce })
      : ''
  }
  ${jsBundles.map(src => injectScript(``, { nonce, src, type: 'module' })).join('\n  ')}
</body>
</html>`
}

/**
 * Render a React component to HTML string (Phase 1 - Basic SSR)
 */
export async function renderPage(ctx: Context, options: RenderOptions): Promise<RenderResult> {
  const startTime = Date.now()

  try {
    const { App, props = {}, initialData } = options

    // Mark render start
    ctx.trace.marks.set('renderStart', Date.now() - ctx.trace.startTime)

    // Render React app to string
    const appHtml = renderToString(<App {...props} />)

    // Mark render complete
    ctx.trace.marks.set('renderComplete', Date.now() - ctx.trace.startTime)

    // Load manifest (or use defaults in development)
    const manifest = loadManifest()

    // Generate complete HTML
    const html = generateHTML({
      appHtml,
      initialData,
      nonce: ctx.security.nonce,
      manifest,
    })

    // Set response mode
    ctx.responseMode = 'static'

    // Apply response headers
    const headers = new ResponseHeaders(ctx)
    headers.applyAll()

    console.log(
      `[SSR] Rendered in ${Date.now() - startTime}ms - ${options.url}`,
    )

    return {
      html,
      status: 200,
    }
  } catch (error) {
    console.error('[SSR] Render error:', error)

    // Return error page
    const errorHtml = generateErrorHTML(error, ctx.security.nonce)

    return {
      html: errorHtml,
      status: 500,
    }
  }
}

/**
 * Load webpack manifest.json
 * In development, falls back to default paths
 */
function loadManifest(): Record<string, string> {
  try {
    const fs = require('fs')
    const path = require('path')

    // Resolve manifest path relative to the server dist directory
    const manifestPath = path.resolve(__dirname, '../../../dist/client/manifest.json')
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
  const isDev = process.env.NODE_ENV !== 'production'

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
