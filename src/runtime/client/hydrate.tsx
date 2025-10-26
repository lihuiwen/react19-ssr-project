/**
 * Client-Side Hydration (Phase 1)
 * Hydrates server-rendered HTML with React
 */

import React from 'react'
import { hydrateRoot } from 'react-dom/client'
import { hydrateResources } from '../shared/resource'

export interface HydrateOptions {
  /** App component to hydrate */
  App: React.ComponentType<any>
  /** Props to pass to the App component */
  props?: any
  /** DOM element to hydrate (defaults to #root) */
  rootElement?: HTMLElement
}

/**
 * Hydrate server-rendered content
 */
export function hydrate(options: HydrateOptions): void {
  const { App, props = {}, rootElement } = options

  // Get root element
  const root = rootElement || document.getElementById('root')

  if (!root) {
    console.error('[Hydration] Root element not found')
    return
  }

  try {
    // Get initial data from window (injected by server)
    const initialData = getInitialData()

    // Hydrate resources from server (Phase 4)
    if (initialData?.resources) {
      hydrateResources(initialData.resources)
      console.log('[Hydration] Restored resources from server:', Object.keys(initialData.resources).length)
    }

    // Merge initial data with props
    const hydrateProps = {
      ...props,
      ...(initialData && { initialData }),
    }

    console.log('[Hydration] Starting hydration...')
    const startTime = performance.now()

    // Hydrate the root
    hydrateRoot(root, <App {...hydrateProps} />)

    const duration = performance.now() - startTime
    console.log(`[Hydration] Completed in ${duration.toFixed(2)}ms`)

    // Report hydration performance
    if (window.performance && window.performance.measure) {
      try {
        performance.mark('hydration-complete')
        performance.measure('hydration', 'navigationStart', 'hydration-complete')
      } catch (e) {
        // Ignore performance measurement errors
      }
    }
  } catch (error) {
    console.error('[Hydration] Error:', error)

    // In case of hydration error, fallback to client-side rendering
    console.warn('[Hydration] Falling back to client-side rendering')

    // Clear the root and re-render
    if (root) {
      root.innerHTML = ''
      const { createRoot } = require('react-dom/client')
      const clientRoot = createRoot(root)
      clientRoot.render(<App {...props} />)
    }
  }
}

/**
 * Get initial data from window object (injected by server)
 */
function getInitialData(): any {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const data = (window as any).__INITIAL_DATA__

    // Clean up to prevent memory leaks
    if (data) {
      delete (window as any).__INITIAL_DATA__
    }

    return data
  } catch (error) {
    console.warn('[Hydration] Failed to parse initial data:', error)
    return null
  }
}

/**
 * Check if running in browser
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

/**
 * Wait for DOM ready before hydrating
 */
export function whenReady(callback: () => void): void {
  if (isBrowser()) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback)
    } else {
      callback()
    }
  }
}
