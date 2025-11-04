import webpack from 'webpack'
import path from 'path'
import fs from 'fs'
import { logger } from '../utils/logger'
import { Errors } from '../utils/error'
import { formatBytes, padEnd } from '../utils/format'
import { generateRoutesJSON } from '../../build/route-scanner'
import clientConfig from '../../build/webpack.client'
import serverConfig from '../../build/webpack.server'

interface BuildOptions {
  analyze?: boolean
  sourcemap?: boolean
}

/**
 * Build command: Build for production
 */
export async function buildCommand(options: BuildOptions) {
  const startTime = Date.now()

  // Print banner
  logger.banner('=� Building for production')
  console.log()

  // Step 1: Scan routes
  const spinner = logger.startSpinner('Scanning routes...')
  const pagesDir = path.resolve(__dirname, '../../../examples/basic/pages')
  const routesOutput = path.resolve(__dirname, '../../../dist/.routes.json')

  try {
    generateRoutesJSON(pagesDir, routesOutput)
    logger.succeedSpinner('Routes scanned successfully')
  } catch (error) {
    logger.failSpinner('Route scanning failed')
    throw error
  }

  // Step 2: Build with webpack
  logger.info('<�  Building client and server bundles...')
  console.log()

  const compiler = webpack([clientConfig, serverConfig] as any)

  if (!compiler) {
    throw Errors.BUILD_FAILED('Failed to create webpack compiler')
  }

  return new Promise<void>((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) {
        logger.error('Build failed', err)
        reject(Errors.BUILD_FAILED(err.message))
        return
      }

      if (!stats) {
        logger.error('No stats available')
        reject(Errors.BUILD_FAILED('No stats available'))
        return
      }

      // Print build results
      const info = stats.toJson()

      if (stats.hasErrors()) {
        console.log()
        logger.error('Build failed with errors')
        console.log()
        info.errors?.forEach((err: any) => {
          console.error(err.message || err)
        })
        reject(Errors.BUILD_FAILED('See errors above'))
        return
      }

      // Print webpack stats
      console.log(
        stats.toString({
          colors: true,
          modules: false,
          children: false,
          chunks: false,
          chunkModules: false,
        })
      )

      console.log()

      if (stats.hasWarnings()) {
        logger.warn('Build completed with warnings')
        console.log()
      }

      // Print summary
      const duration = Date.now() - startTime
      logger.divider()
      logger.success(`Build completed in ${(duration / 1000).toFixed(2)}s`)
      console.log()
      printBuildStats()
      logger.info('=� Run `pnpm start` to start the production server')
      logger.divider()
      console.log()

      // Close compiler
      compiler.close((closeErr) => {
        if (closeErr) {
          logger.error('Error closing compiler', closeErr)
          reject(closeErr)
        } else {
          resolve()
        }
      })
    })
  })
}

/**
 * Print build statistics with file sizes
 */
function printBuildStats() {
  const distPath = path.resolve(__dirname, '../../../dist')
  const clientPath = path.join(distPath, 'client')
  const serverPath = path.join(distPath, 'server')

  logger.info('📊 Build Statistics:')
  console.log()

  // Client bundle stats
  if (fs.existsSync(clientPath)) {
    logger.info('  Client Bundle:')
    const clientFiles = fs.readdirSync(clientPath)
    const jsFiles = clientFiles.filter(f => f.endsWith('.js') && !f.endsWith('.map'))
    const cssFiles = clientFiles.filter(f => f.endsWith('.css'))

    for (const file of [...jsFiles, ...cssFiles]) {
      const filePath = path.join(clientPath, file)
      const stats = fs.statSync(filePath)
      const size = formatBytes(stats.size)
      console.log(`    ${padEnd(file, 30)} ${size}`)
    }
    console.log()
  }

  // Server bundle stats
  if (fs.existsSync(serverPath)) {
    logger.info('  Server Bundle:')
    const serverFiles = fs.readdirSync(serverPath)
    const jsFiles = serverFiles.filter(f => f.endsWith('.js') && !f.endsWith('.map'))

    for (const file of jsFiles) {
      const filePath = path.join(serverPath, file)
      const stats = fs.statSync(filePath)
      const size = formatBytes(stats.size)
      console.log(`    ${padEnd(file, 30)} ${size}`)
    }
  }
}
