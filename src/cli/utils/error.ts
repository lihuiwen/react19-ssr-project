import { logger } from './logger'

/**
 * Custom CLI error with error code and hint
 */
export class CLIError extends Error {
  constructor(
    message: string,
    public code: string = 'CLI_ERROR',
    public hint?: string
  ) {
    super(message)
    this.name = 'CLIError'
  }
}

/**
 * Handle and display error with friendly message
 */
export function handleError(error: Error | CLIError): never {
  console.log()

  if (error instanceof CLIError) {
    logger.error(error.message)
    if (error.hint) {
      console.log()
      logger.info('=¡ Hint: ' + error.hint)
    }
  } else {
    logger.error('Unexpected error occurred')
    if (process.env.DEBUG) {
      console.error(error)
    } else {
      logger.info('Run with DEBUG=* for more details')
    }
  }

  console.log()
  process.exit(1)
}

/**
 * Common error factories
 */
export const Errors = {
  /**
   * Port already in use error
   */
  PORT_IN_USE: (port: number) =>
    new CLIError(
      `Port ${port} is already in use`,
      'PORT_IN_USE',
      `Try:
  " Use a different port: --port ${port + 1}
  " Kill the process: lsof -ti:${port} | xargs kill -9
  " Check what's using the port: lsof -i:${port}`
    ),

  /**
   * Configuration file not found
   */
  CONFIG_NOT_FOUND: () =>
    new CLIError(
      'app.config.ts not found',
      'CONFIG_NOT_FOUND',
      'Create app.config.ts in project root or use default config'
    ),

  /**
   * Build failed error
   */
  BUILD_FAILED: (message: string) =>
    new CLIError(
      `Build failed: ${message}`,
      'BUILD_FAILED',
      'Check the error above for details'
    ),

  /**
   * Module not found error
   */
  MODULE_NOT_FOUND: (moduleName: string) =>
    new CLIError(
      `Module "${moduleName}" not found`,
      'MODULE_NOT_FOUND',
      `Try:
  " Install dependencies: pnpm install
  " Check if module is listed in package.json
  " Clear cache: rm -rf node_modules && pnpm install`
    ),

  /**
   * Webpack build failed error
   */
  WEBPACK_BUILD_FAILED: (message: string) =>
    new CLIError(
      `Webpack build failed`,
      'WEBPACK_BUILD_FAILED',
      `Error: ${message}

Troubleshooting:
  " Check syntax errors in your code
  " Verify all imports are correct
  " Run type-check: pnpm type-check
  " Check webpack config: src/build/webpack.*.ts`
    ),

  /**
   * Build output not found error
   */
  BUILD_OUTPUT_NOT_FOUND: (outDir: string) =>
    new CLIError(
      `Build output not found in "${outDir}"`,
      'BUILD_OUTPUT_NOT_FOUND',
      'Run "pnpm build" first before starting production server'
    ),
}
