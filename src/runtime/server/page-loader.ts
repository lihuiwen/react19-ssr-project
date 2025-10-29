/**
 * Page Loader (Server-side)
 * Loads page components with support for both development (HMR) and production
 *
 * - Production: Static imports (compiled by webpack)
 * - Development: Dynamic require() for hot reload support
 */

import path from 'path'

// Production: Static imports (will be compiled by webpack)
// These imports are only used in production mode
const pageComponents: Record<string, any> = {
  'index.tsx': require('../../../examples/basic/pages/index').default,
  'about.tsx': require('../../../examples/basic/pages/about').default,
  'App.tsx': require('../../../examples/basic/pages/App').default,
  'blog/[id].tsx': require('../../../examples/basic/pages/blog/[id]').default,
  'products.tsx': require('../../../examples/basic/pages/products').default,
}

// Cache for loaded components (for performance and HMR)
const componentCache = new Map<string, any>()

/**
 * Get page component by file path
 * - Production: Uses pre-compiled static imports
 * - Development: Uses dynamic require() for HMR support
 * @param filePath - Route file path (e.g., 'blog/[id].tsx')
 * @param pagesDir - Absolute path to pages directory (only used in development)
 * @returns React component (default export)
 * @throws Error if component not found
 */
export function getPageComponent(filePath: string, pagesDir?: string): any {
  // Production mode: Use static imports (compiled by webpack)
  if (process.env.NODE_ENV === 'production') {
    const component = pageComponents[filePath]

    if (!component) {
      throw new Error(
        `Page component not found: ${filePath}\n` +
        `Available components: ${Object.keys(pageComponents).join(', ')}`
      )
    }

    return component
  }

  // Development mode: Use dynamic require() for HMR
  if (!pagesDir) {
    throw new Error('pagesDir is required in development mode')
  }

  try {
    // Construct absolute path to component
    const absolutePath = path.resolve(pagesDir, filePath)

    // Remove from cache for hot reload
    delete require.cache[require.resolve(absolutePath)]

    // Load the module
    const module = require(absolutePath)

    if (!module || !module.default) {
      throw new Error(`Page component has no default export: ${filePath}`)
    }

    // Cache the component
    componentCache.set(filePath, module.default)

    return module.default
  } catch (error) {
    // Provide helpful error message
    if (error instanceof Error && error.message.includes('Cannot find module')) {
      throw new Error(
        `Page component not found: ${filePath}\n` +
        `Looked in: ${path.resolve(pagesDir, filePath)}`
      )
    }
    throw error
  }
}

/**
 * Clear component cache (for HMR)
 * @param filePath - Optional specific file path to clear
 */
export function clearComponentCache(filePath?: string): void {
  if (filePath) {
    componentCache.delete(filePath)
  } else {
    componentCache.clear()
  }
}

/**
 * Check if page component exists in cache
 * @param filePath - Route file path
 * @returns true if component is cached
 */
export function hasPageComponent(filePath: string): boolean {
  return componentCache.has(filePath)
}
