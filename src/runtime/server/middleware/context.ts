import { Context, Next } from 'koa'
import crypto from 'crypto'
import { generateNonce, sanitizeJSON } from '../security'
import { RequestLogger } from '../logger'

/**
 * 创建上下文注入中间件
 * 必须作为第一个中间件，为所有后续中间件注入 ctx.security、ctx.trace、ctx.log 等
 */
export function createContextMiddleware() {
  return async (ctx: Context, next: Next) => {
    // 生成请求级唯一标识
    const nonce = generateNonce()
    const requestId = crypto.randomUUID()

    // 注入安全层
    ;(ctx as any).security = {
      nonce,
      sanitizeJSON,
    }

    // 注入追踪层
    ;(ctx as any).trace = {
      id: requestId,
      startTime: Date.now(),
      marks: new Map<string, number>(),
    }

    // 注入日志接口（依赖 trace.id）
    ;(ctx as any).log = new RequestLogger(ctx as any)

    // 注入控制层
    ;(ctx as any).abortController = new AbortController()

    // 注入渲染模式（默认流式）
    ;(ctx as any).responseMode = 'stream'

    await next()
  }
}
