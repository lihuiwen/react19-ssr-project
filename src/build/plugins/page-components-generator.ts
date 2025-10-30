/**
 * Page Components Generator Plugin
 *
 * Automatically generates page component mappings from .routes.json
 * for optimal production performance and zero-maintenance development.
 *
 * @see docs/PAGE_LOADER.md for architecture details
 */

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { Compiler } from 'webpack'

/**
 * Route configuration from .routes.json (React Router format)
 */
interface Route {
  path?: string
  index?: boolean
  filePath?: string
  id?: string
  isDynamic?: boolean
  params?: string[]
}

/**
 * Route scan result format
 */
interface RouteScanResult {
  routes: Route[]
  timestamp: number
}

/**
 * Plugin options
 */
interface PluginOptions {
  routesJsonPath: string  // Path to .routes.json
  outputPath: string      // Output path for page-loader.generated.ts
  pagesDir: string        // Absolute path to pages directory
}

export class PageComponentsGeneratorPlugin {
  private routesJsonPath: string
  private outputPath: string
  private pagesDir: string
  private lastRoutesHash: string = ''  // Track .routes.json changes
  private isFirstRun: boolean = true    // Track first compilation

  constructor(options: PluginOptions) {
    this.routesJsonPath = options.routesJsonPath
    this.outputPath = options.outputPath
    this.pagesDir = options.pagesDir
  }

  apply(compiler: Compiler) {
    const pluginName = 'PageComponentsGeneratorPlugin'

    // Hook: Run once before first compilation (production builds only)
    compiler.hooks.beforeRun.tapAsync(
      pluginName,
      (compiler, callback) => {
        try {
          console.log(`\n🔄 [${pluginName}] Generating page components mapping...`)
          this.generatePageComponents()
          this.isFirstRun = false
          callback()
        } catch (error) {
          console.error(`\n❌ [${pluginName}] Failed to generate page components:`, error)
          callback(error as Error)
        }
      }
    )

    // Hook: Watch mode - regenerate on first run and when .routes.json changes
    compiler.hooks.watchRun.tapAsync(
      pluginName,
      (compiler, callback) => {
        // First run in watch mode: generate initial mapping
        // (beforeRun doesn't run in watch mode, so we need to generate here)
        if (this.isFirstRun) {
          this.isFirstRun = false

          if (!fs.existsSync(this.routesJsonPath)) {
            console.warn(`⚠️  [${pluginName}] .routes.json not found, creating empty mapping`)
            this.createEmptyMapping()
            callback()
            return
          }

          try {
            console.log(`\n🔄 [${pluginName}] Initial generation in watch mode...`)
            this.generatePageComponents()
          } catch (error) {
            console.error(`\n❌ [${pluginName}] Failed to generate page components:`, error)
            callback(error as Error)
            return
          }

          callback()
          return
        }

        // Check if .routes.json exists
        if (!fs.existsSync(this.routesJsonPath)) {
          callback()
          return
        }

        try {
          // Calculate hash of .routes.json
          const routesContent = fs.readFileSync(this.routesJsonPath, 'utf-8')
          const currentHash = crypto.createHash('md5').update(routesContent).digest('hex')

          // Only regenerate if content actually changed
          if (currentHash !== this.lastRoutesHash) {
            console.log(`\n🔄 [${pluginName}] Detected .routes.json change, regenerating mapping...`)
            this.generatePageComponents()
          }

          // Note: lastRoutesHash is updated in generatePageComponents()
        } catch (error) {
          console.error(`❌ [${pluginName}] Failed to check .routes.json:`, error)
        }

        callback()
      }
    )
  }

  /**
   * Generate page-loader.generated.ts from .routes.json
   */
  private generatePageComponents() {
    // Check if .routes.json exists
    if (!fs.existsSync(this.routesJsonPath)) {
      console.warn(`⚠️  [PageComponentsGeneratorPlugin] .routes.json not found at ${this.routesJsonPath}`)
      console.warn(`    Skipping page components generation. Run route scanner first.`)

      // Create an empty mapping file to prevent import errors
      this.createEmptyMapping()
      return
    }

    // Read and parse routes
    let scanResult: RouteScanResult
    let routesJson: string
    try {
      routesJson = fs.readFileSync(this.routesJsonPath, 'utf-8')
      scanResult = JSON.parse(routesJson)

      // Update hash to prevent re-generation in watch mode
      this.lastRoutesHash = crypto.createHash('md5').update(routesJson).digest('hex')
    } catch (error) {
      console.error(`❌ Failed to parse .routes.json:`, error)
      throw error
    }

    const routes = scanResult.routes || []

    if (!Array.isArray(routes) || routes.length === 0) {
      console.warn(`⚠️  [PageComponentsGeneratorPlugin] No routes found in .routes.json`)
      this.createEmptyMapping()
      return
    }

    // Generate import statements
    const outputDir = path.dirname(this.outputPath)
    const imports = routes
      .filter((route) => route.filePath) // Only include routes with filePath
      .map((route) => {
        const filePath = route.filePath!

        // Calculate absolute path to the component
        const absolutePath = path.resolve(this.pagesDir, filePath)

        // Calculate relative path from output file to page component
        const relativePath = path.relative(outputDir, absolutePath)

        // Normalize path for cross-platform compatibility (Windows uses backslashes)
        const normalizedPath = relativePath.replace(/\\/g, '/')

        // Remove file extension for require() statement
        const requirePath = normalizedPath.replace(/\.(tsx?|jsx?)$/, '')

        return `  '${filePath}': require('${requirePath}').default,`
      })
      .join('\n')

    // Generate route path to file path mapping
    const routeToFilePathMapping = routes
      .filter((r) => r.filePath && (r.path || r.index))
      .map((r) => {
        const routePath = r.path || '/'  // index routes map to '/'
        return `  '${routePath}': '${r.filePath}',`
      })
      .join('\n')

    // Generate available components list
    const availableComponents = routes
      .filter((r) => r.filePath)
      .map((r) => `  '${r.filePath}',`)
      .join('\n')

    // Generate file content
    const content = `/**
 * Auto-generated by PageComponentsGeneratorPlugin
 * DO NOT EDIT MANUALLY
 *
 * This file is regenerated on every build based on .routes.json
 *
 * @generated
 * Source: ${path.relative(process.cwd(), this.routesJsonPath)}
 * Components: ${routes.length}
 */

/**
 * Static mapping of page file paths to their components
 * Used in production for zero file I/O loading (<0.1ms)
 */
export const pageComponents: Record<string, any> = {
${imports}
}

/**
 * List of all available component file paths
 * Used for error messages and debugging
 */
export const availableComponents: string[] = [
${availableComponents}
]

/**
 * Map of route paths to file paths
 * Used for reverse lookup (route → file)
 *
 * @example
 * '/blog/:id' → 'blog/[id].tsx'
 */
export const routeToFilePath: Record<string, string> = {
${routeToFilePathMapping}
}

/**
 * Get file path by route path
 * @param routePath - Route path like '/blog/:id'
 * @returns File path like 'blog/[id].tsx' or null
 */
export function getFilePathByRoute(routePath: string): string | null {
  return routeToFilePath[routePath] || null
}
`

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // Check if file exists and content is identical (prevent unnecessary writes that trigger watch loops)
    if (fs.existsSync(this.outputPath)) {
      const existingContent = fs.readFileSync(this.outputPath, 'utf-8')
      if (existingContent === content) {
        console.log(`⏭️  [PageComponentsGeneratorPlugin] Content unchanged, skipping write`)
        return
      }
    }

    // Write generated file
    fs.writeFileSync(this.outputPath, content, 'utf-8')

    // Log success
    console.log(`✅ [PageComponentsGeneratorPlugin] Generated mapping (${routes.length} pages)`)
    console.log(`   Output: ${path.relative(process.cwd(), this.outputPath)}`)
  }

  /**
   * Create an empty mapping file to prevent import errors
   */
  private createEmptyMapping() {
    const content = `/**
 * Auto-generated by PageComponentsGeneratorPlugin
 * DO NOT EDIT MANUALLY
 *
 * This is an empty mapping (no routes found)
 *
 * @generated
 */

export const pageComponents: Record<string, any> = {}

export const availableComponents: string[] = []

export const routeToFilePath: Record<string, string> = {}

export function getFilePathByRoute(routePath: string): string | null {
  return null
}
`

    const outputDir = path.dirname(this.outputPath)
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // Check if file exists and content is identical
    if (fs.existsSync(this.outputPath)) {
      const existingContent = fs.readFileSync(this.outputPath, 'utf-8')
      if (existingContent === content) {
        console.log(`⏭️  [PageComponentsGeneratorPlugin] Empty mapping unchanged, skipping write`)
        return
      }
    }

    fs.writeFileSync(this.outputPath, content, 'utf-8')
    console.log(`⚠️  [PageComponentsGeneratorPlugin] Created empty mapping`)
  }
}
