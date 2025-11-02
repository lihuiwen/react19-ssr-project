/**
 * Client-side global error handling
 */
import { showErrorOverlay } from './error-overlay'
import { captureException } from '../shared/error-reporting'

/**
 * Setup global error handlers for the client
 */
export function setupGlobalErrorHandlers() {
  // Catch synchronous errors
  window.addEventListener('error', (event) => {
    const { error } = event

    console.error('[Global Error]', error)

    // Development: show error overlay
    if (process.env.NODE_ENV !== 'production') {
      showErrorOverlay(error)
      event.preventDefault() // Prevent default error display
    } else {
      // Production: report error
      captureException(error, {
        url: window.location.href,
      })
    }
  })

  // Catch async errors (Promise rejections)
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason))

    console.error('[Unhandled Rejection]', error)

    if (process.env.NODE_ENV !== 'production') {
      showErrorOverlay(error)
      event.preventDefault()
    } else {
      captureException(error, {
        type: 'unhandledrejection',
        url: window.location.href,
      })
    }
  })
}

/**
 * HMR integration: close error overlay when error is fixed
 */
export function setupHMRErrorHandling() {
  if (typeof module !== 'undefined' && (module as any).hot) {
    const hot = (module as any).hot

    hot.addStatusHandler((status: string) => {
      if (status === 'apply') {
        // Import dynamically to avoid circular dependency
        import('./error-overlay').then(({ hideErrorOverlay, getCurrentError }) => {
          if (getCurrentError()) {
            console.log('[HMR] Error fixed, closing overlay')
            hideErrorOverlay()
          }
        })
      }
    })
  }
}

/**
 * HMR: Accept updates to this module without reloading the page
 */
if (typeof module !== 'undefined' && (module as any).hot) {
  ;(module as any).hot.accept((err: any) => {
    if (err) {
      console.error('[ErrorHandler] HMR Error:', err)
    }
  })
}
