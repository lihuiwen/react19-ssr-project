import React, { useEffect } from 'react'
import { createRoot, Root } from 'react-dom/client'
import './error-overlay.css'

export interface ErrorOverlayProps {
  error: Error
  onClose: () => void
}

export function ErrorOverlay({ error, onClose }: ErrorOverlayProps) {
  useEffect(() => {
    // ESC key to close
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="error-overlay">
      {/* Semi-transparent backdrop */}
      <div className="error-overlay-backdrop" onClick={onClose} />

      {/* Error card */}
      <div className="error-overlay-content">
        {/* Error header */}
        <div className="error-overlay-header">
          <div className="error-overlay-icon">❌</div>
          <div className="error-overlay-title">
            <h2>{error.name}</h2>
            <p>{error.message}</p>
          </div>
          <button className="error-overlay-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Stack trace (plain text) */}
        <div className="error-overlay-stack">
          <h3>Stack Trace</h3>
          <pre>{error.stack || 'No stack trace available'}</pre>
        </div>

        {/* Close button */}
        <div className="error-overlay-footer">
          <button className="btn-close" onClick={onClose}>
            Close (ESC)
          </button>
        </div>
      </div>
    </div>
  )
}

// Global error overlay management
let overlayRoot: Root | null = null
let currentError: Error | null = null

/**
 * Show error overlay
 */
export function showErrorOverlay(error: Error) {
  // Only show in development
  if (process.env.NODE_ENV === 'production') return

  currentError = error

  // Create container
  let container = document.getElementById('error-overlay-root')
  if (!container) {
    container = document.createElement('div')
    container.id = 'error-overlay-root'
    document.body.appendChild(container)
  }

  // Render overlay
  if (!overlayRoot) {
    overlayRoot = createRoot(container)
  }

  overlayRoot.render(
    <ErrorOverlay error={error} onClose={hideErrorOverlay} />
  )
}

/**
 * Hide error overlay
 */
export function hideErrorOverlay() {
  currentError = null
  if (overlayRoot) {
    overlayRoot.unmount()
    overlayRoot = null
  }
  const container = document.getElementById('error-overlay-root')
  if (container) {
    container.remove()
  }
}

/**
 * Get current error
 */
export function getCurrentError(): Error | null {
  return currentError
}

/**
 * HMR: Accept updates to this module without reloading the page
 */
if (typeof module !== 'undefined' && (module as any).hot) {
  ;(module as any).hot.accept((err: any) => {
    if (err) {
      console.error('[ErrorOverlay] HMR Error:', err)
    }
  })
}
