import { Context, Next } from 'koa'
import { renderToString } from 'react-dom/server'
import React from 'react'
import { NotFound } from '../../shared/error-pages/NotFound'
import { ServerError } from '../../shared/error-pages/ServerError'
import crypto from 'crypto'
import path from 'path'
import fs from 'fs'

export function createErrorHandlerMiddleware() {
  return async (ctx: Context, next: Next) => {
    try {
      await next()

      // 404 处理
      if (ctx.status === 404 || !ctx.body) {
        handle404(ctx)
      }
    } catch (err) {
      // 500 处理
      handle500(ctx, err as Error)
    }
  }
}

/**
 * 404 Not Found 处理
 */
function handle404(ctx: Context) {
  ctx.status = 404

  // 判断客户端期望的响应格式
  const acceptsHTML = ctx.accepts('html', 'json') === 'html'

  if (acceptsHTML) {
    // 检查是否有自定义 404 页面
    const custom404 = loadCustomErrorPage('404')

    const html = renderToString(
      custom404 || React.createElement(NotFound, { path: ctx.path })
    )

    ctx.type = 'text/html'
    ctx.body = wrapHTML(html, '404 Not Found')
  } else {
    // JSON 响应
    ctx.type = 'application/json'
    ctx.body = {
      error: 'Not Found',
      message: `Cannot ${ctx.method} ${ctx.path}`,
      statusCode: 404,
    }
  }

  // 记录日志
  console.log(`[404] ${ctx.method} ${ctx.path}`)
}

/**
 * 500 Server Error 处理
 */
function handle500(ctx: Context, error: Error) {
  ctx.status = 500

  // 生成错误追踪 ID
  const errorId = crypto.randomBytes(8).toString('hex')

  // 记录错误日志
  console.error(`[500] Error ID: ${errorId}`)
  console.error(error)

  // 上报到错误日志服务（如果配置了）
  if ((global as any).__ERROR_REPORTER__) {
    ;(global as any).__ERROR_REPORTER__.captureException(error, {
      errorId,
      url: ctx.url,
      method: ctx.method,
    })
  }

  const acceptsHTML = ctx.accepts('html', 'json') === 'html'

  if (acceptsHTML) {
    // 检查是否有自定义 500 页面
    const custom500 = loadCustomErrorPage('500')

    const html = renderToString(
      custom500 || React.createElement(ServerError, {
        error: process.env.NODE_ENV !== 'production' ? error : undefined,
        errorId,
      })
    )

    ctx.type = 'text/html'
    ctx.body = wrapHTML(html, '500 Server Error')
  } else {
    // JSON 响应
    ctx.type = 'application/json'
    ctx.body = {
      error: 'Internal Server Error',
      message: process.env.NODE_ENV !== 'production' ? error.message : 'An unexpected error occurred',
      errorId,
      statusCode: 500,
    }
  }
}

/**
 * 加载自定义错误页面
 */
function loadCustomErrorPage(type: '404' | '500'): React.ReactElement | null {
  try {
    const pagePath = path.resolve(process.cwd(), `examples/basic/pages/${type}.tsx`)
    if (fs.existsSync(pagePath)) {
      // 清除 require 缓存（支持 HMR）
      delete require.cache[pagePath]
      const { default: Page } = require(pagePath)
      return React.createElement(Page)
    }
  } catch (err) {
    console.warn(`Failed to load custom ${type} page:`, err)
  }
  return null
}

/**
 * 包装 HTML（内联 CSS 方案）
 */
function wrapHTML(content: string, title: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    /* 内联 CSS - 错误页面完全自包含，无需外部文件 */
    ${getErrorPageStyles()}
  </style>
</head>
<body>
  ${content}
</body>
</html>
  `.trim()
}

/**
 * 获取错误页面样式
 */
function getErrorPageStyles(): string {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
        'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
        sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .error-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .error-content {
      text-align: center;
      max-width: 600px;
    }

    .error-code {
      font-size: 8rem;
      font-weight: 900;
      margin: 0;
      line-height: 1;
      text-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }

    .error-title {
      font-size: 2rem;
      margin: 1rem 0;
    }

    .error-description {
      font-size: 1.125rem;
      opacity: 0.9;
      margin: 1rem 0 2rem;
    }

    .error-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      margin: 2rem 0;
      flex-wrap: wrap;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      font-weight: 600;
      text-decoration: none;
      transition: transform 0.2s;
      cursor: pointer;
      border: none;
      font-size: 1rem;
      display: inline-block;
    }

    .btn:hover {
      transform: translateY(-2px);
    }

    .btn-primary {
      background: white;
      color: #667eea;
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 2px solid white;
    }

    .error-path {
      margin: 1rem 0;
      opacity: 0.8;
    }

    .error-path code {
      background: rgba(255, 255, 255, 0.2);
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
    }

    .error-suggestions {
      margin-top: 2rem;
      opacity: 0.9;
    }

    .error-suggestions ul {
      list-style: none;
      padding: 0;
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .error-suggestions a {
      color: white;
      text-decoration: underline;
    }

    .error-details {
      margin: 2rem 0;
      text-align: left;
      background: rgba(0, 0, 0, 0.2);
      padding: 1rem;
      border-radius: 0.5rem;
    }

    .error-details summary {
      cursor: pointer;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .error-stack {
      margin-top: 1rem;
    }

    .error-stack h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1rem;
    }

    .error-stack pre {
      background: rgba(0, 0, 0, 0.3);
      padding: 1rem;
      border-radius: 0.25rem;
      overflow: auto;
      font-size: 0.875rem;
      line-height: 1.5;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .error-id {
      margin: 1rem 0;
      font-size: 0.875rem;
      opacity: 0.8;
    }

    .error-id code {
      background: rgba(255, 255, 255, 0.2);
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-family: 'Monaco', 'Menlo', monospace;
    }

    .error-illustration {
      max-width: 200px;
      margin: 2rem auto;
      display: block;
    }
  `.trim()
}
