import React from 'react'

export interface ServerErrorProps {
  /** 错误对象 */
  error?: Error
  /** 错误追踪 ID */
  errorId?: string
  /** Retry 回调 */
  onRetry?: () => void
}

export function ServerError({ error, errorId, onRetry }: ServerErrorProps) {
  const isDev = process.env.NODE_ENV !== 'production'

  return (
    <div className="error-page server-error">
      <div className="error-content">
        {/* 大号 500 */}
        <h1 className="error-code">500</h1>

        {/* 主标题 */}
        <h2 className="error-title">Server Error</h2>

        {/* 描述文案 */}
        <p className="error-description">
          {isDev && error
            ? 'An error occurred while rendering this page.'
            : 'Something went wrong on our end. Please try again later.'
          }
        </p>

        {/* 错误追踪 ID */}
        {errorId && (
          <p className="error-id">
            Error ID: <code>{errorId}</code>
          </p>
        )}

        {/* 开发环境：显示错误详情 */}
        {isDev && error && (
          <details className="error-details">
            <summary>Error Details (Development Only)</summary>
            <div className="error-stack">
              <h3>{error.name}: {error.message}</h3>
              <pre>{error.stack}</pre>
            </div>
          </details>
        )}

        {/* 操作按钮 */}
        <div className="error-actions">
          {onRetry && (
            <button onClick={onRetry} className="btn btn-primary">
              Try Again
            </button>
          )}
          <button
            onClick={() => window.location.href = '/'}
            className="btn btn-secondary"
          >
            Go to Home
          </button>
        </div>
      </div>

      {/* 装饰性插图 */}
      <div className="error-illustration" style={{ fontSize: '5rem', textAlign: 'center', margin: '2rem 0' }}>
        ⚠️
      </div>
    </div>
  )
}
