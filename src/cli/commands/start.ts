import path from 'path'
import fs from 'fs'
import { logger } from '../utils/logger'
import { checkPort } from '../utils/port'
import { Errors } from '../utils/error'

interface StartOptions {
  port: string
  host: string
}

/**
 * Start command: Start production server
 */
export async function startCommand(options: StartOptions) {
  const port = parseInt(options.port)
  const host = options.host

  // Set production environment
  process.env.NODE_ENV = 'production'
  process.env.PORT = port.toString()
  process.env.HOST = host

  // Print banner
  logger.banner('=� Starting production server')
  console.log()

  // Step 1: Check if build files exist
  const spinner = logger.startSpinner('Checking build files...')
  const distPath = path.resolve(__dirname, '../../../dist')
  const clientPath = path.join(distPath, 'client')
  const serverPath = path.join(distPath, 'server')

  if (!fs.existsSync(distPath) || !fs.existsSync(clientPath) || !fs.existsSync(serverPath)) {
    logger.failSpinner('Build files not found')
    throw Errors.BUILD_OUTPUT_NOT_FOUND(distPath)
  }

  logger.succeedSpinner('Build files found')

  // Step 2: Check if port is available
  const portSpinner = logger.startSpinner(`Checking port ${port}...`)
  const isPortAvailable = await checkPort(port)

  if (!isPortAvailable) {
    logger.failSpinner(`Port ${port} is in use`)
    throw Errors.PORT_IN_USE(port)
  }

  logger.succeedSpinner(`Port ${port} is available`)

  // Step 3: Start server
  console.log()
  logger.info('=� Starting server...')
  logger.divider()
  console.log()

  // Import and start compiled server.js
  const serverJsPath = path.join(serverPath, 'server.js')
  const serverModule = await import(serverJsPath)
  const startServerFn = serverModule.startServer || serverModule.default?.startServer

  if (!startServerFn) {
    throw new Error('Failed to find startServer function in compiled server bundle')
  }

  const server = await startServerFn()

  // Print success message
  console.log()
  logger.divider()
  logger.success('Production server is running!')
  console.log()
  logger.info(`  � Local:   http://localhost:${port}`)
  logger.info(`  � Network: http://${host}:${port}`)
  console.log()
  logger.info('Press Ctrl+C to stop')
  logger.divider()
  console.log()

  // Graceful shutdown
  setupGracefulShutdown(server)
}

/**
 * Setup graceful shutdown handlers
 */
function setupGracefulShutdown(server: any) {
  const shutdown = () => {
    console.log()
    logger.info('=K Shutting down server...')

    server.close(() => {
      logger.success('Server closed gracefully')
      process.exit(0)
    })

    // Force shutdown after 10 seconds
    setTimeout(() => {
      logger.warn('Forcing shutdown...')
      process.exit(1)
    }, 10000)
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}
