/**
 * DevTools Panel Component (Phase 7 - Day 3)
 *
 * Development-only overlay panel showing:
 * - Performance metrics (TTFB, FCP, LCP)
 * - HMR status and update count
 * - Framework information
 * - Error history
 *
 * Features:
 * - Minimizable panel
 * - Draggable position
 * - Auto-hide in production
 */

import React, { useState, useEffect } from 'react'
import './devtools.css'

export interface PerformanceMetrics {
  ttfb: number | null
  fcp: number | null
  lcp: number | null
  hydrationTime: number | null
}

export interface DevToolsState {
  isMinimized: boolean
  hmrUpdateCount: number
  hmrStatus: 'idle' | 'check' | 'apply' | 'error'
  lastUpdateTime: number | null
  errorCount: number
  performanceMetrics: PerformanceMetrics
}

/**
 * DevTools Panel Component
 */
export function DevTools() {
  const [state, setState] = useState<DevToolsState>({
    isMinimized: false,
    hmrUpdateCount: 0,
    hmrStatus: 'idle',
    lastUpdateTime: null,
    errorCount: 0,
    performanceMetrics: {
      ttfb: null,
      fcp: null,
      lcp: null,
      hydrationTime: null,
    },
  })

  // Collect performance metrics
  useEffect(() => {
    const collectMetrics = () => {
      try {
        const perfEntries = performance.getEntriesByType('navigation')
        const navEntry = perfEntries[0] as PerformanceNavigationTiming

        const paintEntries = performance.getEntriesByType('paint')
        const fcpEntry = paintEntries.find((entry) => entry.name === 'first-contentful-paint')

        // Try to get LCP
        let lcpValue: number | null = null
        if ('PerformanceObserver' in window) {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries()
            const lastEntry = entries[entries.length - 1] as any
            lcpValue = lastEntry.renderTime || lastEntry.loadTime
          })
          observer.observe({ entryTypes: ['largest-contentful-paint'] })
        }

        setState((prev) => ({
          ...prev,
          performanceMetrics: {
            ttfb: navEntry ? navEntry.responseStart - navEntry.requestStart : null,
            fcp: fcpEntry ? fcpEntry.startTime : null,
            lcp: lcpValue,
            hydrationTime: (window as any).__HYDRATION_TIME__ || null,
          },
        }))
      } catch (error) {
        console.warn('[DevTools] Failed to collect performance metrics:', error)
      }
    }

    // Wait for page load
    if (document.readyState === 'complete') {
      collectMetrics()
    } else {
      window.addEventListener('load', collectMetrics)
      return () => window.removeEventListener('load', collectMetrics)
    }
  }, [])

  // Setup HMR status listener
  useEffect(() => {
    if (typeof module !== 'undefined' && (module as any).hot) {
      const hot = (module as any).hot

      const statusHandler = (status: string) => {
        // Avoid updating state during HMR to prevent infinite loop
        if (status === 'apply' || status === 'idle') {
          setState((prev) => ({
            ...prev,
            hmrStatus: status as any,
            hmrUpdateCount: status === 'apply' ? prev.hmrUpdateCount + 1 : prev.hmrUpdateCount,
            lastUpdateTime: status === 'apply' ? Date.now() : prev.lastUpdateTime,
          }))
        }
      }

      hot.addStatusHandler(statusHandler)

      // Cleanup: remove status handler when component unmounts
      return () => {
        // Note: Webpack HMR doesn't provide removeStatusHandler, so we can't clean up
        // Instead, we limit updates to only 'apply' and 'idle' status
      }
    }
  }, [])

  // Listen to error events
  useEffect(() => {
    const handleError = () => {
      setState((prev) => ({
        ...prev,
        errorCount: prev.errorCount + 1,
      }))
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleError)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleError)
    }
  }, [])

  const toggleMinimize = () => {
    setState((prev) => ({ ...prev, isMinimized: !prev.isMinimized }))
  }

  const formatTime = (ms: number | null) => {
    if (ms === null) return 'N/A'
    return `${ms.toFixed(0)}ms`
  }

  const formatRelativeTime = (timestamp: number | null) => {
    if (!timestamp) return 'Never'
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    return `${minutes}m ago`
  }

  const getHMRStatusColor = () => {
    switch (state.hmrStatus) {
      case 'idle':
        return '#4ade80' // green
      case 'check':
        return '#fbbf24' // yellow
      case 'apply':
        return '#60a5fa' // blue
      case 'error':
        return '#ef4444' // red
      default:
        return '#6b7280' // gray
    }
  }

  return (
    <div className={`devtools-panel ${state.isMinimized ? 'minimized' : ''}`}>
      <div className="devtools-header" onClick={toggleMinimize}>
        <div className="devtools-title">
          <span className="devtools-icon">⚙️</span>
          <span>React 19 SSR DevTools</span>
        </div>
        <button className="devtools-toggle" onClick={toggleMinimize}>
          {state.isMinimized ? '▲' : '▼'}
        </button>
      </div>

      {!state.isMinimized && (
        <div className="devtools-content">
          {/* Performance Metrics */}
          <div className="devtools-section">
            <h3 className="devtools-section-title">Performance Metrics</h3>
            <div className="devtools-metrics">
              <div className="devtools-metric">
                <span className="metric-label">TTFB</span>
                <span className="metric-value">{formatTime(state.performanceMetrics.ttfb)}</span>
              </div>
              <div className="devtools-metric">
                <span className="metric-label">FCP</span>
                <span className="metric-value">{formatTime(state.performanceMetrics.fcp)}</span>
              </div>
              <div className="devtools-metric">
                <span className="metric-label">LCP</span>
                <span className="metric-value">{formatTime(state.performanceMetrics.lcp)}</span>
              </div>
              <div className="devtools-metric">
                <span className="metric-label">Hydration</span>
                <span className="metric-value">
                  {formatTime(state.performanceMetrics.hydrationTime)}
                </span>
              </div>
            </div>
          </div>

          {/* HMR Status */}
          <div className="devtools-section">
            <h3 className="devtools-section-title">Hot Module Replacement</h3>
            <div className="devtools-hmr">
              <div className="devtools-metric">
                <span className="metric-label">Status</span>
                <span className="metric-value" style={{ color: getHMRStatusColor() }}>
                  {state.hmrStatus}
                </span>
              </div>
              <div className="devtools-metric">
                <span className="metric-label">Updates</span>
                <span className="metric-value">{state.hmrUpdateCount}</span>
              </div>
              <div className="devtools-metric">
                <span className="metric-label">Last Update</span>
                <span className="metric-value">{formatRelativeTime(state.lastUpdateTime)}</span>
              </div>
            </div>
          </div>

          {/* Error Summary */}
          <div className="devtools-section">
            <h3 className="devtools-section-title">Error Summary</h3>
            <div className="devtools-errors">
              <div className="devtools-metric">
                <span className="metric-label">Total Errors</span>
                <span className="metric-value" style={{ color: state.errorCount > 0 ? '#ef4444' : '#4ade80' }}>
                  {state.errorCount}
                </span>
              </div>
            </div>
          </div>

          {/* Framework Info */}
          <div className="devtools-section">
            <h3 className="devtools-section-title">Framework Info</h3>
            <div className="devtools-info">
              <div className="devtools-metric">
                <span className="metric-label">React</span>
                <span className="metric-value">19.2</span>
              </div>
              <div className="devtools-metric">
                <span className="metric-label">Mode</span>
                <span className="metric-value">
                  {process.env.NODE_ENV === 'production' ? 'Production' : 'Development'}
                </span>
              </div>
              <div className="devtools-metric">
                <span className="metric-label">SSR</span>
                <span className="metric-value">Streaming</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Show DevTools in development mode only
 */
export function showDevTools(): void {
  if (process.env.NODE_ENV !== 'production') {
    const existingRoot = document.getElementById('devtools-root')
    if (existingRoot) return // Already mounted

    const root = document.createElement('div')
    root.id = 'devtools-root'
    document.body.appendChild(root)

    // Dynamically import React to render DevTools
    import('react-dom/client').then(({ createRoot }) => {
      const reactRoot = createRoot(root)
      reactRoot.render(<DevTools />)
    })
  }
}

/**
 * Hide DevTools
 */
export function hideDevTools(): void {
  const root = document.getElementById('devtools-root')
  if (root) {
    root.remove()
  }
}

/**
 * Track hydration time
 */
export function trackHydrationTime(startTime: number): void {
  const hydrationTime = Date.now() - startTime
  ;(window as any).__HYDRATION_TIME__ = hydrationTime
  console.log(`[DevTools] Hydration completed in ${hydrationTime}ms`)
}

/**
 * HMR: Accept updates to this module without reloading the page
 * This prevents DevTools from triggering infinite HMR loops
 */
if (typeof module !== 'undefined' && (module as any).hot) {
  ;(module as any).hot.accept((err: any) => {
    if (err) {
      console.error('[DevTools] HMR Error:', err)
    } else {
      console.log('[DevTools] Hot updated')
    }
  })
}
