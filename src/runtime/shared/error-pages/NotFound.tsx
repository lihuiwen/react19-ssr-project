import React from 'react'

export interface NotFoundProps {
  /** 请求的 URL 路径 */
  path?: string
  /** 自定义提示文案 */
  message?: string
}

export function NotFound({ path, message }: NotFoundProps) {
  return (
    <div className="error-page not-found">
      <div className="error-content">
        {/* 大号 404 */}
        <h1 className="error-code">404</h1>

        {/* 主标题 */}
        <h2 className="error-title">Page Not Found</h2>

        {/* 描述文案 */}
        <p className="error-description">
          {message || "The page you're looking for doesn't exist."}
        </p>

        {/* 显示请求路径（开发模式） */}
        {process.env.NODE_ENV !== 'production' && path && (
          <p className="error-path">
            Requested path: <code>{path}</code>
          </p>
        )}

        {/* 操作按钮 */}
        <div className="error-actions">
          <a href="/" className="btn btn-primary">
            Go to Home
          </a>
          <button onClick={() => window.history.back()} className="btn btn-secondary">
            Go Back
          </button>
        </div>

        {/* 搜索建议（可选） */}
        <div className="error-suggestions">
          <p>You might be looking for:</p>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/blog">Blog</a></li>
          </ul>
        </div>
      </div>

      {/* 装饰性插图 */}
      <NotFoundIllustration />
    </div>
  )
}

function NotFoundIllustration() {
  return (
    <svg className="error-illustration" viewBox="0 0 200 200" style={{ maxWidth: '200px', margin: '2rem auto' }}>
      {/* 简单的 404 插图 */}
      <text x="50%" y="50%" textAnchor="middle" fontSize="48" fill="currentColor">
        🔍
      </text>
    </svg>
  )
}
