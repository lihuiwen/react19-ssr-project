import crypto from 'crypto'
import { RequestContext } from '../../../types/framework'

/**
 * 统一响应头管理
 * 所有 HTTP 响应头必须通过此类设置
 */
export class ResponseHeaders {
  constructor(private ctx: RequestContext) {}

  /**
   * 设置 CSP 响应头（基于请求级 nonce）
   */
  setCSP() {
    const { nonce } = this.ctx.security
    const policy = `script-src 'nonce-${nonce}' 'strict-dynamic'; object-src 'none'; base-uri 'none';`

    this.ctx.res.setHeader('Content-Security-Policy', policy)
  }

  /**
   * 设置 Server-Timing 响应头（性能指标）
   */
  setServerTiming() {
    const metrics = Array.from(this.ctx.trace.marks.entries())
      .map(([name, value]) => `${name};dur=${value}`)
      .join(', ')

    if (metrics) {
      this.ctx.res.setHeader('Server-Timing', metrics)
    }
  }

  /**
   * 设置 Cache-Control（根据渲染模式）
   */
  setCacheControl() {
    const { responseMode } = this.ctx

    let cacheControl: string

    switch (responseMode) {
      case 'static':
        cacheControl = 'public, max-age=31536000, immutable'
        break
      case 'ppr':
        cacheControl = 'public, max-age=3600, stale-while-revalidate=86400'
        break
      default:
        cacheControl = 'private, no-cache'
    }

    this.ctx.res.setHeader('Cache-Control', cacheControl)
  }

  /**
   * 设置 ETag（用于 PPR 缓存验证）
   */
  setETag(content: string) {
    const hash = crypto.createHash('md5').update(content).digest('hex')
    this.ctx.res.setHeader('ETag', `"${hash}"`)
  }

  /**
   * 设置请求追踪 ID
   */
  setRequestId() {
    this.ctx.res.setHeader('X-Request-ID', this.ctx.trace.id)
  }

  /**
   * 统一应用所有响应头
   */
  applyAll() {
    this.setCSP()
    this.setServerTiming()
    this.setCacheControl()
    this.setRequestId()
  }
}
