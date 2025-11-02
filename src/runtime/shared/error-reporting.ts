/**
 * Error Reporting Interface
 * Provides abstraction for error logging services (Sentry, LogRocket, etc.)
 */

/**
 * Error context metadata
 */
export interface ErrorContext {
  /** Error tracking ID */
  errorId?: string
  /** Request URL */
  url?: string
  /** HTTP method */
  method?: string
  /** Error type/category */
  type?: string
  /** Custom tags for filtering */
  tags?: Record<string, string>
  /** Additional data */
  extra?: Record<string, any>
}

/**
 * Error reporter interface
 */
export interface ErrorReporter {
  /**
   * Report an exception
   */
  captureException(error: Error, context?: ErrorContext): void

  /**
   * Report a message
   */
  captureMessage(message: string, level?: 'info' | 'warning' | 'error'): void
}

/**
 * Console-based reporter (default implementation)
 */
export class ConsoleReporter implements ErrorReporter {
  captureException(error: Error, context?: ErrorContext): void {
    console.error('[Error Report]', error)
    if (context) {
      console.error('[Error Context]', context)
    }
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    const logFn = console[level] || console.log
    logFn('[Message]', message)
  }
}

/**
 * Global error reporter instance
 */
let reporter: ErrorReporter = new ConsoleReporter()

/**
 * Initialize error reporter with a custom implementation
 *
 * @example
 * ```ts
 * // Integrate with Sentry
 * import * as Sentry from '@sentry/react'
 *
 * class SentryReporter implements ErrorReporter {
 *   constructor(dsn: string) {
 *     Sentry.init({ dsn })
 *   }
 *
 *   captureException(error: Error, context?: ErrorContext) {
 *     Sentry.captureException(error, {
 *       tags: context?.tags,
 *       extra: context?.extra
 *     })
 *   }
 *
 *   captureMessage(message: string, level = 'info') {
 *     Sentry.captureMessage(message, level as any)
 *   }
 * }
 *
 * initErrorReporter(new SentryReporter('https://xxx@sentry.io/xxx'))
 * ```
 */
export function initErrorReporter(customReporter: ErrorReporter): void {
  reporter = customReporter
}

/**
 * Get the current error reporter instance
 */
export function getErrorReporter(): ErrorReporter {
  return reporter
}

/**
 * Report an exception (convenience function)
 */
export function captureException(error: Error, context?: ErrorContext): void {
  reporter.captureException(error, context)
}

/**
 * Report a message (convenience function)
 */
export function captureMessage(message: string, level?: 'info' | 'warning' | 'error'): void {
  reporter.captureMessage(message, level)
}
