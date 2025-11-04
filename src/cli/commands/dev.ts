import { spawn, ChildProcess } from 'child_process'
import path from 'path'
import { logger } from '../utils/logger'
import { checkPort } from '../utils/port'
import { Errors } from '../utils/error'
import { generateRoutesJSON, watchRoutes } from '../../build/route-scanner'

interface DevOptions {
  port: string
  host: string
  open: boolean
}

/**
 * Dev command: Start development server with HMR
 */
export async function devCommand(options: DevOptions) {
  const port = parseInt(options.port)
  const host = options.host

  // Print banner
  logger.banner('=� React 19 SSR Framework - Development Mode')
  console.log()

  // Step 1: Check if port is available
  const spinner = logger.startSpinner(`Checking port ${port}...`)
  const isPortAvailable = await checkPort(port)

  if (!isPortAvailable) {
    logger.failSpinner(`Port ${port} is in use`)
    throw Errors.PORT_IN_USE(port)
  }

  logger.succeedSpinner(`Port ${port} is available`)

  // Step 2: Scan routes
  logger.info('=� Scanning routes...')
  const pagesDir = path.resolve(__dirname, '../../../examples/basic/pages')
  const routesOutput = path.resolve(__dirname, '../../../dist/.routes.json')

  try {
    generateRoutesJSON(pagesDir, routesOutput)
    logger.success('Routes scanned successfully')
  } catch (error) {
    logger.error('Route scanning failed', error as Error)
    throw error
  }

  // Step 3: Watch routes for changes
  watchRoutes(pagesDir, routesOutput, () => {
    logger.info('= Routes updated, regenerating routes.json...')
  })

  // Step 4: Start dual-server development environment
  console.log()
  logger.info('=� Starting dual-server development environment...')
  logger.divider()
  console.log()

  const devScriptPath = path.resolve(__dirname, '../../../scripts/dev.js')

  const devProcess = spawn('node', [devScriptPath], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: 'development',
      PORT: port.toString(),
      HOST: host,
    },
  })

  // Handle process errors
  devProcess.on('error', (error: Error) => {
    logger.error('Development environment error', error)
    process.exit(1)
  })

  devProcess.on('exit', (code: number | null) => {
    if (code !== 0 && code !== null) {
      logger.error(`Development environment exited with code ${code}`)
      process.exit(code)
    }
  })

  // Graceful shutdown
  setupGracefulShutdown(devProcess)

  // Open browser if requested
  if (options.open) {
    setTimeout(async () => {
      try {
        // Note: 'open' package needs to be installed separately
        // pnpm add -D open@^8.4.2
        // @ts-ignore - optional dependency
        const open = await import('open')
        await open.default(`http://${host}:${port}`)
        logger.success(`Browser opened at http://${host}:${port}`)
      } catch (error) {
        logger.warn('Failed to open browser - install "open" package to enable this feature')
      }
    }, 2000) // Wait 2 seconds for server to start
  }
}

/**
 * Setup graceful shutdown handlers
 */
function setupGracefulShutdown(devProcess: ChildProcess) {
  const shutdown = () => {
    console.log()
    logger.info('=K Shutting down development environment...')
    if (devProcess) {
      devProcess.kill('SIGTERM')
    }
    setTimeout(() => {
      process.exit(0)
    }, 500)
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}
