/**
 * Route Scanner (Phase 2.5 - React Router Integration)
 * Scans pages/ directory at build time and generates React Router RouteObject[] configuration
 */

import * as fs from 'fs'
import * as path from 'path'

/**
 * React Router RouteObject format
 * This matches the structure expected by createBrowserRouter/createStaticRouter
 */
export interface RouteObject {
  /** Route path (e.g., /blog/:id) */
  path?: string
  /** Is this an index route? (for index.tsx files) */
  index?: boolean
  /** Nested child routes */
  children?: RouteObject[]
  /** Component identifier (used for lazy loading) */
  id?: string
  /** File path relative to pages/ directory (for build-time code generation) */
  filePath?: string
  /** Is this a dynamic route? */
  isDynamic?: boolean
  /** Parameter names for dynamic routes */
  params?: string[]
}

export interface RouteScanResult {
  routes: RouteObject[]
  timestamp: number
}

/**
 * Scan pages directory and generate route configurations
 */
export function scanRoutes(pagesDir: string): RouteScanResult {
  const routes: RouteObject[] = []

  function scanDirectory(dir: string, basePath = ''): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      const relativePath = path.join(basePath, entry.name)

      if (entry.isDirectory()) {
        // Skip api directory (handled separately in Phase 3)
        if (entry.name === 'api') {
          continue
        }

        // Recursively scan subdirectory
        scanDirectory(fullPath, relativePath)
      } else if (entry.isFile()) {
        // Only process .tsx and .ts files (excluding .d.ts)
        if (
          (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) &&
          !entry.name.endsWith('.d.ts')
        ) {
          const route = fileToRoute(relativePath, pagesDir)
          if (route) {
            routes.push(route)
          }
        }
      }
    }
  }

  // Start scanning from pages directory
  if (!fs.existsSync(pagesDir)) {
    throw new Error(`Pages directory not found: ${pagesDir}`)
  }

  scanDirectory(pagesDir)

  // Sort routes by specificity (static routes before dynamic routes)
  // Also sort by path length (longer paths first for better matching)
  routes.sort((a, b) => {
    // Static routes have higher priority than dynamic routes
    if (a.isDynamic !== b.isDynamic) {
      return a.isDynamic ? 1 : -1
    }

    // Longer paths have higher priority
    const aPath = a.path || ''
    const bPath = b.path || ''
    const aDepth = aPath.split('/').length
    const bDepth = bPath.split('/').length
    if (aDepth !== bDepth) {
      return bDepth - aDepth
    }

    // Alphabetical order for same depth
    return aPath.localeCompare(bPath)
  })

  return {
    routes,
    timestamp: Date.now(),
  }
}

/**
 * Convert file path to React Router RouteObject configuration
 */
function fileToRoute(filePath: string, pagesDir: string): RouteObject | null {
  // Remove file extension
  let routePath = filePath.replace(/\.(tsx|ts)$/, '')

  // Check if this is an index route
  const isIndex = routePath === 'index' || routePath.endsWith('/index')

  // Convert index.tsx to /
  if (isIndex) {
    routePath = routePath.replace(/\/?index$/, '') || '/'
  }

  // Convert path separators to URL format
  routePath = '/' + routePath.replace(/\\/g, '/')

  // Extract dynamic route parameters [id] -> :id
  const params: string[] = []
  let isDynamic = false

  routePath = routePath.replace(/\[([^\]]+)\]/g, (_, paramName) => {
    isDynamic = true
    params.push(paramName)
    return `:${paramName}`
  })

  // Ensure path starts with /
  if (!routePath.startsWith('/')) {
    routePath = '/' + routePath
  }

  // Remove trailing slash (except for root path)
  if (routePath !== '/' && routePath.endsWith('/')) {
    routePath = routePath.slice(0, -1)
  }

  // Generate unique ID for the route (used for code splitting)
  const id = routePath === '/' ? 'index' : routePath.replace(/^\//, '').replace(/\//g, '-')

  const relativeFilePath = path.relative(pagesDir, path.join(pagesDir, filePath))

  // For index routes at the root level, use index: true instead of path: '/'
  if (routePath === '/') {
    return {
      index: true,
      id,
      filePath: relativeFilePath,
      isDynamic,
      params,
    }
  }

  return {
    path: routePath,
    id,
    filePath: relativeFilePath,
    isDynamic,
    params,
  }
}

/**
 * Generate routes.json file
 */
export function generateRoutesJSON(pagesDir: string, outputPath: string): void {
  const result = scanRoutes(pagesDir)

  // Create output directory if it doesn't exist
  const outputDir = path.dirname(outputPath)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  // Write routes.json
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8')

  console.log(
    `[Route Scanner] Generated routes.json with ${result.routes.length} routes (React Router format):`,
  )
  result.routes.forEach((route) => {
    const routePath = route.index ? '/ (index)' : route.path
    const params = route.params && route.params.length > 0 ? ` (params: ${route.params.join(', ')})` : ''
    console.log(`  ${routePath}${params}`)
  })
}

/**
 * Watch pages directory for changes and regenerate routes
 */
export function watchRoutes(
  pagesDir: string,
  outputPath: string,
  onChange?: () => void,
): void {
  console.log(`[Route Scanner] Watching ${pagesDir} for changes...`)

  let debounceTimer: NodeJS.Timeout | null = null

  fs.watch(
    pagesDir,
    { recursive: true },
    (eventType: string, filename: string | null) => {
      if (!filename) return

      // Only regenerate for .tsx and .ts files
      if (
        filename.endsWith('.tsx') ||
        (filename.endsWith('.ts') && !filename.endsWith('.d.ts'))
      ) {
        // Debounce to avoid multiple regenerations
        if (debounceTimer) {
          clearTimeout(debounceTimer)
        }

        debounceTimer = setTimeout(() => {
          console.log(`[Route Scanner] File changed: ${filename}, regenerating routes...`)
          generateRoutesJSON(pagesDir, outputPath)

          if (onChange) {
            onChange()
          }
        }, 100)
      }
    },
  )
}

/**
 * Load routes from generated routes.json
 */
export function loadRoutes(routesJsonPath: string): RouteScanResult {
  if (!fs.existsSync(routesJsonPath)) {
    throw new Error(`Routes JSON not found: ${routesJsonPath}`)
  }

  const content = fs.readFileSync(routesJsonPath, 'utf-8')
  return JSON.parse(content)
}
