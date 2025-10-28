/**
 * Page Loader (Server-side)
 * Loads page components using Node.js require() with dynamic paths
 *
 * Note: require.context is Webpack-only and can't be used on server.
 * Server uses direct require() with file paths.
 */

import path from 'path'

// Cache for loaded components (for performance and HMR)
const componentCache = new Map<string, any>()

/**
 * Get page component by file path using Node.js require()
 * @param filePath - Route file path (e.g., 'blog/[id].tsx')
 * @param pagesDir - Absolute path to pages directory
 * @returns React component (default export)
 * @throws Error if component not found
 */
export function getPageComponent(filePath: string, pagesDir: string): any {
  try {
    // Construct absolute path to component
    const absolutePath = path.resolve(pagesDir, filePath)

    // Remove from cache in development for hot reload
    if (process.env.NODE_ENV === 'development') {
      delete require.cache[require.resolve(absolutePath)]
    }

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
