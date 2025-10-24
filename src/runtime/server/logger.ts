import { RequestContext, Logger } from '../../../types/framework'

/**
 * 请求级日志器
 * Phase 0-7: 使用 console 输出（带 requestId）
 * Phase 8+: 迁移到 Pino/Winston（只改这个类，接口不变）
 */
export class RequestLogger implements Logger {
  constructor(private ctx: RequestContext) {}

  /**
   * 格式化日志输出（结构化 JSON）
   */
  private format(level: string, message: string, meta?: Record<string, any>): string {
    return JSON.stringify({
      level,
      message,
      requestId: this.ctx.trace.id,
      timestamp: new Date().toISOString(),
      url: this.ctx.url,
      method: this.ctx.method,
      ...meta,
    })
  }

  /**
   * 调试日志（仅开发环境）
   */
  debug(message: string, meta?: Record<string, any>): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.format('debug', message, meta))
    }
  }

  /**
   * 信息日志
   */
  info(message: string, meta?: Record<string, any>): void {
    console.info(this.format('info', message, meta))
  }

  /**
   * 警告日志
   */
  warn(message: string, meta?: Record<string, any>): void {
    console.warn(this.format('warn', message, meta))
  }

  /**
   * 错误日志
   */
  error(message: string, meta?: Record<string, any>): void {
    console.error(this.format('error', message, meta))
  }
}
