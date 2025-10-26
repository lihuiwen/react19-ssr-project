/**
 * Page Loader (Phase 2)
 * Pre-loads all page components at build time
 */

// Import all page components
// This file will be replaced by webpack with actual imports
const pageComponents: Record<string, any> = {
  'index.tsx': require('../../../examples/basic/pages/index').default,
  'about.tsx': require('../../../examples/basic/pages/about').default,
  'App.tsx': require('../../../examples/basic/pages/App').default,
  'blog/[id].tsx': require('../../../examples/basic/pages/blog/[id]').default,
}

/**
 * Get page component by file path
 */
export function getPageComponent(filePath: string): any {
  const component = pageComponents[filePath]

  if (!component) {
    throw new Error(`Page component not found: ${filePath}`)
  }

  return component
}

/**
 * Check if page component exists
 */
export function hasPageComponent(filePath: string): boolean {
  return filePath in pageComponents
}

/**
 * Get all registered page components
 */
export function getAllPageComponents(): Record<string, any> {
  return pageComponents
}
