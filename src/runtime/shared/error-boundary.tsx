/**
 * Error Boundary Component (Phase 4)
 *
 * Catches errors in data fetching and component rendering.
 * Provides different UI for development and production environments.
 */

import React, { Component, ReactNode } from 'react'

export interface ErrorBoundaryProps {
  /** Fallback UI to show when an error occurs */
  fallback?: ReactNode | ((error: Error, retry: () => void) => ReactNode)
  /** Callback when an error is caught */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  /** Children components */
  children: ReactNode
}

export interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Error Boundary Component
 *
 * Wraps components that may throw errors (e.g., components using use() Hook).
 * Displays fallback UI when an error occurs and allows retry.
 *
 * @example
 * ```tsx
 * <ErrorBoundary fallback={<ErrorFallback />}>
 *   <BlogPost id="123" />
 * </ErrorBoundary>
 * ```
 *
 * @example
 * ```tsx
 * <ErrorBoundary
 *   fallback={(error, retry) => (
 *     <div>
 *       <p>Error: {error.message}</p>
 *       <button onClick={retry}>Retry</button>
 *     </div>
 *   )}
 * >
 *   <BlogPost id="123" />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to console
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)

    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // In production, you might want to send error to logging service
    // e.g., Sentry, LogRocket, etc.
  }

  retry = () => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Render fallback UI
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback(this.state.error, this.retry)
        }
        return this.props.fallback
      }

      // Default fallback UI
      return <DefaultErrorFallback error={this.state.error} retry={this.retry} />
    }

    return this.props.children
  }
}

/**
 * Default Error Fallback UI
 */
function DefaultErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  const isDev = process.env.NODE_ENV !== 'production'

  return (
    <div
      style={{
        padding: '20px',
        margin: '20px',
        border: '2px solid #e53e3e',
        borderRadius: '8px',
        backgroundColor: '#fff5f5',
      }}
    >
      <h2 style={{ color: '#e53e3e', marginTop: 0 }}>⚠️ Something went wrong</h2>
      <p style={{ color: '#742a2a' }}>
        An error occurred while loading this content.
      </p>

      {isDev && (
        <details style={{ marginTop: '16px' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#742a2a' }}>
            Error Details (Development Only)
          </summary>
          <pre
            style={{
              marginTop: '8px',
              padding: '12px',
              backgroundColor: '#2d3748',
              color: '#f7fafc',
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '12px',
            }}
          >
            {error.stack || error.message}
          </pre>
        </details>
      )}

      <button
        onClick={retry}
        style={{
          marginTop: '16px',
          padding: '8px 16px',
          backgroundColor: '#3182ce',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold',
        }}
      >
        Retry
      </button>
    </div>
  )
}

/**
 * Hook-based error boundary (using experimental React APIs)
 * Note: This is for demonstration - React doesn't officially support hook-based error boundaries yet
 */
// export function useErrorBoundary() {
//   const [error, setError] = useState<Error | null>(null)
//
//   if (error) {
//     throw error
//   }
//
//   return {
//     showError: setError,
//     resetError: () => setError(null),
//   }
// }
