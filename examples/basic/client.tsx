/**
 * Client Entry Point (Phase 5 - HMR Support)
 * Hydrates the server-rendered React app using React Router v6
 * Supports Hot Module Replacement in development
 */

import React from 'react'
import { hydrateRoot } from 'react-dom/client'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { hydrateResources } from '../../src/runtime/shared/resource'
import './styles/global.css'

// Get root element
const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found')
}

// Track if we've already hydrated (for HMR updates)
let isHydrated = false

/**
 * Webpack require.context for all page components
 * Automatically imports all .tsx/.ts files from pages/ directory
 * This eliminates the need for manual maintenance when adding new pages
 *
 * Note: Using 'sync' mode (not 'lazy') because we need immediate access
 * to components during hydration. Lazy mode would return Promises.
 */
const pagesContext = require.context(
  './pages',
  true, // recursive
  /^(?!.*\.d\.ts$).*\.(tsx|ts)$/ // match .tsx and .ts, exclude .d.ts
  // mode defaults to 'sync' when omitted
)

/**
 * Normalize require.context key to route file path
 * @example './index.tsx' -> 'index.tsx'
 * @example './blog/[id].tsx' -> 'blog/[id].tsx'
 */
function normalizeContextKey(key: string): string {
  return key.replace(/^\.\//, '')
}

/**
 * Load component registry dynamically
 * This allows HMR to get the latest versions of components
 */
function getComponentRegistry(): Record<string, React.ComponentType<any>> {
  const registry: Record<string, React.ComponentType<any>> = {}

  // Load all components from require.context
  pagesContext.keys().forEach((key) => {
    const filePath = normalizeContextKey(key)
    try {
      const module = pagesContext(key)
      if (module.default) {
        registry[filePath] = module.default
      } else {
        console.warn(`[Client] No default export for ${filePath}`)
      }
    } catch (error) {
      console.warn(`[Client] Failed to load component ${filePath}:`, error)
    }
  })

  return registry
}

/**
 * Create routes from server data and component registry
 */
function createRoutes() {
  const initialData = (window as any).__INITIAL_DATA__
  const serverRoutes = initialData?.routes || []
  const componentRegistry = getComponentRegistry()

  return serverRoutes.map((route: any) => {
    const { filePath, ...rest } = route

    if (!filePath) {
      return rest
    }

    // Load component from registry
    const Component = componentRegistry[filePath as string]

    if (!Component) {
      console.warn(`[Client] Component not found for ${filePath}`)
      return rest
    }

    return {
      ...rest,
      element: <Component />,
    }
  })
}

/**
 * Render function - handles both initial hydration and HMR updates
 */
function render() {
  // Get initial data from server (only on first load)
  const initialData = (window as any).__INITIAL_DATA__

  // Hydrate resources from server (Phase 4)
  if (initialData?.resources && !isHydrated) {
    hydrateResources(initialData.resources)
    console.log(
      '[Client] Restored resources from server:',
      Object.keys(initialData.resources).length
    )
  }

  // Create routes with latest components
  const routes = createRoutes()
  console.log('[Client] Creating router with', routes.length, 'routes')

  // Create browser router
  const router = createBrowserRouter(routes)

  // Create App component with RouterProvider
  const App = () => <RouterProvider router={router} />

  // First load: hydrate
  // HMR updates: render
  if (!isHydrated && rootElement) {
    console.log('[Client] Hydrating...')
    hydrateRoot(rootElement, <App />)
    isHydrated = true
  } else if (rootElement) {
    console.log('🔥 Hot Module Replacement triggered')
    const root = createRoot(rootElement)
    root.render(<App />)
  }
}

// Initial render
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', render)
} else {
  render()
}

// Hot Module Replacement (HMR) support
// This enables hot reloading in development without full page refresh
if (typeof module !== 'undefined' && module.hot) {
  /**
   * Accept updates to the pages context
   *
   * Important: According to Webpack docs (https://github.com/webpack/webpack/issues/834),
   * require.context() creates dynamic dependencies. We have two approaches:
   *
   * Approach 1: Use context.id (Webpack internal module ID for the context itself)
   * - Monitors the context module, but may not always trigger for individual file changes
   *
   * Approach 2: Use context.keys() (All module paths tracked by context)
   * - More reliable for catching individual file updates
   * - However, context.keys() returns relative paths like ['./index.tsx', './about.tsx']
   *   which may not match Webpack's internal module resolution
   *
   * Best practice (from webpack-hot-module-reload-with-context-example):
   * Accept the context.id AND manually track the keys for comprehensive coverage
   */

  // Accept updates to the context module itself
  module.hot.accept(pagesContext.id, () => {
    console.log('🔥 Pages context updated, re-rendering...')
    render()
  })

  // Also accept updates to individual page modules
  // Note: We need to convert context keys to proper module paths
  const pageModulePaths = pagesContext.keys().map(key => {
    // Convert './index.tsx' to './pages/index'
    return './pages/' + key.replace(/^\.\//, '').replace(/\.(tsx|ts)$/, '')
  })

  module.hot.accept(pageModulePaths, () => {
    console.log('🔥 Page component updated, re-rendering...')
    render()
  })

  // Accept updates to this module itself
  module.hot.accept((err: any) => {
    if (err) {
      console.error('❌ HMR Error:', err)
    }
  })

  // Store data for the next hot update
  module.hot.dispose((data: any) => {
    // You can store state here if needed
    data.isHydrated = isHydrated
  })
}
