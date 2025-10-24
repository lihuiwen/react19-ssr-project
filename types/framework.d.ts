import { Context, Next } from 'koa'
import { IncomingMessage, ServerResponse } from 'http'

// ============================================
// Phase 0: 安全与可观测性基础类型
// ============================================

/**
 * 安全上下文
 */
export interface SecurityContext {
  /** 请求级 CSP nonce (16 字节 base64) */
  nonce: string
  /** 防 XSS 的 JSON 序列化 */
  sanitizeJSON: (data: any) => string
}

/**
 * 追踪上下文（可观测性）
 */
export interface TraceContext {
  /** 请求唯一标识 (UUID) */
  id: string
  /** 请求开始时间戳 (ms) */
  startTime: number
  /** 性能标记点 (名称 -> 耗时ms) */
  marks: Map<string, number>
}

/**
 * 日志接口（Phase 0 定义，支持后续迁移到 Pino/Winston）
 */
export interface Logger {
  debug(message: string, meta?: Record<string, any>): void
  info(message: string, meta?: Record<string, any>): void
  warn(message: string, meta?: Record<string, any>): void
  error(message: string, meta?: Record<string, any>): void
}

/**
 * 统一请求上下文（扩展 Koa Context）
 */
export interface RequestContext extends Context {
  /** 安全层 */
  security: SecurityContext
  /** 追踪层 */
  trace: TraceContext
  /** 日志接口 */
  log: Logger
  /** 控制层 */
  abortController: AbortController
  /** 渲染模式 */
  responseMode: 'stream' | 'static' | 'ppr'
  /** 路由上下文（Phase 2 补充） */
  route?: {
    path: string
    params: Record<string, string>
    query: Record<string, string>
  }
}

/**
 * 脚本注入选项
 */
export interface InjectScriptOptions {
  nonce: string
  type?: 'module' | 'text/javascript'
  async?: boolean
}

/**
 * 安全配置
 */
export interface SecurityConfig {
  /** 启用 CSP */
  csp: boolean
  /** 使用请求级 nonce */
  nonce: boolean
  /** CSP 策略（可选自定义） */
  cspPolicy?: string
}

/**
 * 可观测性配置
 */
export interface ObservabilityConfig {
  /** 启用 Server-Timing 响应头 */
  serverTiming: boolean
  /** 启用 X-Request-ID 响应头 */
  requestId: boolean
}

// ============================================
// Phase 1+: 路由、数据、中间件类型
// ============================================

export interface Route {
  path: string
  filePath: string
  component?: React.ComponentType<any>
}

export type Loader = (context: RequestContext) => Promise<any>

export type Middleware = (ctx: RequestContext, next: Next) => Promise<void>

export interface PageComponent extends React.FC<any> {
  loader?: Loader
}

export type ApiHandler = (ctx: RequestContext) => Promise<void>

/**
 * 流式渲染选项（Phase 0 定义接口，Phase 4 实现）
 */
export interface StreamRenderOptions {
  runtime?: 'node' | 'edge' | 'auto'

  /** Streaming 协议配置 */
  streaming?: {
    /** 揭示策略：batched=批量揭示，progressive=渐进式揭示 */
    revealStrategy?: 'batched' | 'progressive'
    /** 外壳超时时间（ms），默认 5000 */
    shellTimeout?: number
    /** Suspense 边界 ID 前缀，默认 'B' */
    boundaryPrefix?: string
  }

  /** 回调函数 */
  onShellReady?: () => void
  onShellError?: (error: Error) => void
  onAllReady?: () => void
  onError?: (error: Error) => void
}

/**
 * Suspense 边界配置（Phase 4 使用）
 */
export interface SuspenseBoundary {
  /** 边界 ID，格式: B:${route}:${index} */
  id: string
  /** Fallback 内容 */
  fallback: string
  /** 优先级（batched 模式使用） */
  priority?: number
}

/**
 * 路由依赖（Phase 2 产出）
 */
export interface RouteDeps {
  /** JavaScript 文件 */
  js?: string[]
  /** CSS 文件 */
  css?: string[]
  /** 预加载资源 */
  preload?: string[]
  /** 预获取资源 */
  prefetch?: string[]
}

/**
 * 应用配置
 */
export interface AppConfig {
  server: {
    port: number
    host?: string
    runtime: 'node' | 'edge' | 'auto'
    security: SecurityConfig
    observability: ObservabilityConfig

    /** Streaming 配置（Phase 0 定义，Phase 4 生效） */
    streaming?: {
      revealStrategy?: 'batched' | 'progressive'
      shellTimeout?: number
      boundaryPrefix?: string
    }
  }
  build?: {
    outDir: string
    publicPath: string
    sourcemap: boolean
  }
}

// ============================================
// Phase 10.5: PPR 类型
// ============================================

export interface PPRConfig {
  enabled: boolean
  strategy: 'static' | 'dynamic' | 'hybrid' | 'auto'
  timeout: number
  cache: {
    type: 'memory' | 'redis' | 'filesystem'
    ttl: number
  }
}

export interface PostponedState {
  // React 内部状态，必须可序列化
  [key: string]: any
}

export interface PrerenderResult {
  prelude: ReadableStream | string
  postponed: PostponedState | null
}

export interface PPRCache {
  get(key: string): Promise<PostponedState | null>
  set(key: string, state: PostponedState, ttl?: number): Promise<void>
  delete(key: string): Promise<void>
}
