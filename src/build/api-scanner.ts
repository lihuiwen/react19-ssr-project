/**
 * API Route Scanner (Phase 3)
 * Scans pages/api/ directory and generates API route configuration
 */

import * as fs from 'fs'
import * as path from 'path'

export interface ApiRoute {
  /** Route path (e.g., /api/hello) */
  path: string
  /** File path relative to pages/api/ directory */
  filePath: string
  /** Is this a dynamic route? */
  isDynamic: boolean
  /** Parameter names for dynamic routes */
  params: string[]
  /** HTTP methods supported (extracted from handler if possible) */
  methods?: string[]
}

export interface ApiScanResult {
  routes: ApiRoute[]
  timestamp: number
}

/**
 * Scan pages/api directory and generate API route configurations
 */
export function scanApiRoutes(apiDir: string): ApiScanResult {
  const routes: ApiRoute[] = []

  function scanDirectory(dir: string, basePath = ''): void {
    if (!fs.existsSync(dir)) {
      // API directory doesn't exist yet, return empty routes
      return
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      const relativePath = path.join(basePath, entry.name)

      if (entry.isDirectory()) {
        // Recursively scan subdirectory
        scanDirectory(fullPath, relativePath)
      } else if (entry.isFile()) {
        // Only process .ts and .js files (excluding .d.ts)
        if (
          (entry.name.endsWith('.ts') || entry.name.endsWith('.js')) &&
          !entry.name.endsWith('.d.ts')
        ) {
          const route = fileToApiRoute(relativePath, apiDir)
          if (route) {
            routes.push(route)
          }
        }
      }
    }
  }

  // Start scanning from api directory
  scanDirectory(apiDir)

  // Sort routes by specificity (static routes before dynamic routes)
  routes.sort((a, b) => {
    // Static routes have higher priority
    if (a.isDynamic !== b.isDynamic) {
      return a.isDynamic ? 1 : -1
    }

    // Longer paths have higher priority
    const aDepth = a.path.split('/').length
    const bDepth = b.path.split('/').length
    if (aDepth !== bDepth) {
      return bDepth - aDepth
    }

    // Alphabetical order
    return a.path.localeCompare(b.path)
  })

  return {
    routes,
    timestamp: Date.now(),
  }
}

/**
 * Convert file path to API route configuration
 */
function fileToApiRoute(filePath: string, apiDir: string): ApiRoute | null {
  // Remove file extension
  let routePath = filePath.replace(/\.(ts|js)$/, '')

  // Convert path separators to URL format
  routePath = '/api/' + routePath.replace(/\\/g, '/')

  // Extract dynamic route parameters [id] -> :id
  const params: string[] = []
  let isDynamic = false

  routePath = routePath.replace(/\[([^\]]+)\]/g, (_, paramName) => {
    isDynamic = true
    params.push(paramName)
    return `:${paramName}`
  })

  // Ensure path starts with /api/
  if (!routePath.startsWith('/api/')) {
    routePath = '/api/' + routePath
  }

  // Remove trailing slash (except for /api itself)
  if (routePath !== '/api' && routePath.endsWith('/')) {
    routePath = routePath.slice(0, -1)
  }

  return {
    path: routePath,
    filePath: path.relative(apiDir, path.join(apiDir, filePath)),
    isDynamic,
    params,
  }
}

/**
 * Generate api-routes.json file
 */
export function generateApiRoutesJSON(apiDir: string, outputPath: string): void {
  const result = scanApiRoutes(apiDir)

  // Create output directory if it doesn't exist
  const outputDir = path.dirname(outputPath)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  // Write api-routes.json
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8')

  console.log(
    `[API Scanner] Generated api-routes.json with ${result.routes.length} API routes:`,
  )
  result.routes.forEach((route) => {
    const params = route.params && route.params.length > 0 ? ` (params: ${route.params.join(', ')})` : ''
    console.log(`  ${route.path}${params}`)
  })
}

/**
 * Watch pages/api directory for changes and regenerate routes
 */
export function watchApiRoutes(
  apiDir: string,
  outputPath: string,
  onChange?: () => void,
): void {
  if (!fs.existsSync(apiDir)) {
    console.log(`[API Scanner] API directory does not exist: ${apiDir}`)
    return
  }

  console.log(`[API Scanner] Watching ${apiDir} for changes...`)

  let debounceTimer: NodeJS.Timeout | null = null

  fs.watch(
    apiDir,
    { recursive: true },
    (eventType: string, filename: string | null) => {
      if (!filename) return

      // Only regenerate for .ts and .js files
      if (
        filename.endsWith('.ts') ||
        filename.endsWith('.js') &&
        !filename.endsWith('.d.ts')
      ) {
        // Debounce to avoid multiple regenerations
        if (debounceTimer) {
          clearTimeout(debounceTimer)
        }

        debounceTimer = setTimeout(() => {
          console.log(`[API Scanner] File changed: ${filename}, regenerating API routes...`)
          generateApiRoutesJSON(apiDir, outputPath)

          if (onChange) {
            onChange()
          }
        }, 100)
      }
    },
  )
}

/**
 * Load API routes from generated api-routes.json
 */
export function loadApiRoutes(apiRoutesJsonPath: string): ApiScanResult {
  if (!fs.existsSync(apiRoutesJsonPath)) {
    // Return empty routes if file doesn't exist
    return { routes: [], timestamp: Date.now() }
  }

  const content = fs.readFileSync(apiRoutesJsonPath, 'utf-8')
  return JSON.parse(content)
}
