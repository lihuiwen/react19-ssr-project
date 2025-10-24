# Phase 0 实施检查清单

> 本文档提供 Phase 0 的详细实施步骤，按照优先级和依赖关系排序

## 📋 总览

**目标**: 搭建完整的开发环境、类型系统和安全可观测性基础设施
**预计时间**: 1-2 天
**验收**: 所有 ✅ 标记项完成，`pnpm type-check` 通过

---

## Step 1: 项目结构初始化 (30 分钟)

### 1.1 创建目录结构

```bash
# 核心运行时
mkdir -p src/runtime/server/middleware
mkdir -p src/runtime/server/streaming
mkdir -p src/runtime/client
mkdir -p src/runtime/shared

# 构建工具
mkdir -p src/build

# CLI 工具
mkdir -p src/cli

# 示例项目
mkdir -p examples/basic/pages/api
mkdir -p examples/basic/public
mkdir -p examples/basic/locales

# 类型定义
mkdir -p types

# 配置文件目录
mkdir -p config
```

### 1.2 验收标准

```bash
✅ 运行 `tree src -L 3` 显示完整目录结构
✅ 运行 `tree examples -L 2` 显示示例项目结构
✅ 运行 `tree types -L 1` 显示类型定义目录
```

---

## Step 2: 依赖安装 (20 分钟)

### 2.1 更新 package.json

```json
{
  "name": "react19-ssr-framework",
  "version": "0.1.0",
  "type": "commonjs",
  "scripts": {
    "type-check": "tsc --noEmit",
    "type-check:watch": "tsc --noEmit --watch",
    "dev": "echo 'Not implemented yet'",
    "build": "echo 'Not implemented yet'",
    "start": "echo 'Not implemented yet'"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "koa": "^2.15.0",
    "@koa/router": "^12.0.1",
    "koa-bodyparser": "^4.4.1",
    "koa-static": "^5.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/koa": "^2.14.0",
    "@types/koa__router": "^12.0.4",
    "typescript": "^5.3.3",
    "webpack": "^5.89.0",
    "webpack-cli": "^5.1.4",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.32",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.55.0",
    "prettier": "^3.1.1"
  }
}
```

### 2.2 安装依赖

```bash
pnpm install
```

### 2.3 验收标准

```bash
✅ node_modules/ 目录存在
✅ pnpm-lock.yaml 文件生成
✅ 无依赖冲突错误
```

---

## Step 3: TypeScript 配置 (40 分钟)

### 3.1 根配置 - tsconfig.json

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@runtime/*": ["src/runtime/*"],
      "@build/*": ["src/build/*"],
      "@cli/*": ["src/cli/*"]
    }
  },
  "include": ["src", "types", "examples"],
  "exclude": ["node_modules", "dist"]
}
```

### 3.2 服务端配置 - tsconfig.server.json

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "CommonJS",
    "lib": ["ES2022"],
    "types": ["node"]
  },
  "include": ["src/runtime/server", "src/build", "src/cli"]
}
```

### 3.3 客户端配置 - tsconfig.client.json

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": []
  },
  "include": ["src/runtime/client", "src/runtime/shared"]
}
```

### 3.4 构建工具配置 - tsconfig.build.json

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "CommonJS",
    "lib": ["ES2022"],
    "types": ["node", "webpack"]
  },
  "include": ["src/build"]
}
```

### 3.5 示例项目配置 - examples/basic/tsconfig.json

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["pages", "middleware.ts", "app.config.ts"]
}
```

### 3.6 验收标准

```bash
✅ 5 个 tsconfig 文件创建完成
✅ 运行 pnpm type-check 无错误（虽然还没有代码）
```

---

## Step 4: 类型定义文件 (60 分钟) ⭐ **核心任务**

### 4.1 全局类型 - types/global.d.ts

```typescript
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test'
      PORT?: string
      HOST?: string
    }
  }

  interface Window {
    __INITIAL_DATA__?: any
    __ROUTE_DATA__?: any
  }
}

export {}
```

### 4.2 核心框架类型 - types/framework.d.ts

```typescript
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
```

### 4.3 Webpack 类型 - types/webpack.d.ts

```typescript
declare module '*.css' {
  const content: string
  export default content
}

declare module '*.module.css' {
  const classes: { [key: string]: string }
  export default classes
}
```

### 4.4 验收标准

```bash
✅ 3 个类型定义文件创建完成
✅ RequestContext 包含 security、trace、abortController、responseMode
✅ SecurityContext 包含 nonce 和 sanitizeJSON
✅ TraceContext 包含 id、startTime、marks
✅ pnpm type-check 通过
```

---

## Step 5: 安全模块实现 (60 分钟) ⭐ **核心任务**

### 5.1 安全工具 - src/runtime/server/security.ts

```typescript
import crypto from 'crypto'

/**
 * 生成请求级 CSP nonce (16 字节 base64)
 */
export function generateNonce(): string {
  return crypto.randomBytes(16).toString('base64')
}

/**
 * 统一脚本注入（强制使用 nonce）
 * @param content - 脚本内容
 * @param options - 注入选项（必须包含 nonce）
 */
export function injectScript(
  content: string,
  options: {
    nonce: string
    type?: 'module' | 'text/javascript'
    async?: boolean
  }
): string {
  const { nonce, type = 'module', async = false } = options

  return `<script type="${type}" nonce="${nonce}"${async ? ' async' : ''}>
${content}
</script>`
}

/**
 * 防 XSS 的 JSON 序列化
 * 转义 <、>、& 字符，防止 </script> 注入攻击
 */
export function sanitizeJSON(data: any): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')  // 防止 </script>
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')  // 防止 Line Separator
    .replace(/\u2029/g, '\\u2029')  // 防止 Paragraph Separator
}
```

### 5.2 验收标准

```bash
✅ generateNonce() 生成 24 字符长度的 base64 字符串
✅ injectScript() 输出包含 nonce 属性
✅ sanitizeJSON() 正确转义 <script></script> 为 \u003cscript\u003e\u003c/script\u003e
```

---

## Step 5.5: 日志接口实现 (30 分钟) ⭐ **核心任务**

> 现在定义接口，实现先用 console，Phase 8 迁移到 Pino/Winston

### 5.5.1 日志类 - src/runtime/server/logger.ts

```typescript
import { RequestContext, Logger } from '../../types/framework'

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

  debug(message: string, meta?: Record<string, any>): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.format('debug', message, meta))
    }
  }

  info(message: string, meta?: Record<string, any>): void {
    console.info(this.format('info', message, meta))
  }

  warn(message: string, meta?: Record<string, any>): void {
    console.warn(this.format('warn', message, meta))
  }

  error(message: string, meta?: Record<string, any>): void {
    console.error(this.format('error', message, meta))
  }
}
```

### 5.5.2 在中间件中注入（稍后在 Step 7 实现）

```typescript
// src/runtime/server/middleware/context.ts（预览）
import { RequestLogger } from '../logger'

export function createContextMiddleware() {
  return async (ctx, next) => {
    // ... 其他注入

    // 注入日志接口
    ;(ctx as any).log = new RequestLogger(ctx as any)

    await next()
  }
}
```

### 5.5.3 使用示例

```typescript
// 任何地方都可以使用 ctx.log
export async function renderPage(ctx: RequestContext) {
  ctx.log.info('SSR rendering started', { route: ctx.url })

  try {
    const html = await streamRender(ctx)
    ctx.log.info('SSR rendering completed', { duration: Date.now() - ctx.trace.startTime })
    return html
  } catch (error) {
    ctx.log.error('SSR rendering failed', { error: error.message, stack: error.stack })
    throw error
  }
}
```

### 5.5.4 验收标准

```bash
✅ RequestLogger 类实现 Logger 接口
✅ 所有日志输出包含 requestId
✅ debug 日志仅在开发环境输出
✅ 日志格式为结构化 JSON
```

---

## Step 6: 响应头管理 (45 分钟)

### 6.1 响应头类 - src/runtime/server/headers.ts

```typescript
import crypto from 'crypto'
import { RequestContext } from '../../types/framework'

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
```

### 6.2 验收标准

```bash
✅ ResponseHeaders 类定义完整
✅ setCSP() 包含 nonce 占位符
✅ setCacheControl() 根据 responseMode 返回不同策略
✅ applyAll() 调用所有设置方法
```

---

## Step 7: 上下文注入中间件 (30 分钟)

### 7.1 中间件 - src/runtime/server/middleware/context.ts

```typescript
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
```

### 7.2 验收标准

```bash
✅ createContextMiddleware() 函数导出
✅ 中间件注入 ctx.security、ctx.trace、ctx.log、ctx.abortController、ctx.responseMode
✅ nonce 每次请求不同
✅ ctx.log.info() 能输出带 requestId 的日志
✅ requestId 使用 UUID 格式
```

---

## Step 8: 应用配置模板 (20 分钟)

### 8.1 配置文件 - examples/basic/app.config.ts

```typescript
import { AppConfig } from '../../types/framework'

const config: AppConfig = {
  server: {
    port: 3000,
    host: 'localhost',
    runtime: 'auto',

    // 安全配置
    security: {
      csp: true,
      nonce: true,
    },

    // 可观测性配置
    observability: {
      serverTiming: true,
      requestId: true,
    },

    // Streaming 配置（Phase 0 定义，Phase 4 生效）
    streaming: {
      revealStrategy: 'progressive',  // 'batched' | 'progressive'
      shellTimeout: 5000,             // 外壳超时 5 秒
      boundaryPrefix: 'B',            // Suspense 边界 ID 前缀
    },
  },

  build: {
    outDir: 'dist',
    publicPath: '/',
    sourcemap: true,
  },
}

export default config
```

### 8.2 验收标准

```bash
✅ app.config.ts 创建完成
✅ 配置包含 security、observability 和 streaming 字段
✅ TypeScript 类型检查通过
✅ streaming 配置包含 revealStrategy、shellTimeout、boundaryPrefix
```

---

## Step 9: 配置文件 (30 分钟)

### 9.1 Tailwind CSS - tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './examples/basic/pages/**/*.{js,ts,jsx,tsx}',
    './src/runtime/client/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### 9.2 PostCSS - postcss.config.js

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### 9.3 Git 忽略 - .gitignore

```
# 依赖
node_modules/
pnpm-lock.yaml

# 构建产物
dist/
.cache/

# 环境变量
.env
.env.local

# 系统文件
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
```

### 9.4 环境变量模板 - .env.example

```
NODE_ENV=development
PORT=3000
HOST=localhost
```

### 9.5 验收标准

```bash
✅ 4 个配置文件创建完成
✅ .gitignore 包含 node_modules、dist
```

---

## Step 10: 示例页面 (15 分钟)

### 10.1 首页 - examples/basic/pages/index.tsx

```typescript
import React from 'react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to React 19 SSR Framework
        </h1>
        <p className="text-gray-600">
          Phase 0 初始化完成 ✅
        </p>
      </div>
    </div>
  )
}
```

### 10.2 验收标准

```bash
✅ pages/index.tsx 创建完成
✅ 使用 Tailwind CSS 类名
✅ TypeScript 检查通过
```

---

## Step 11: 最终验收 (10 分钟)

### 11.1 运行检查

```bash
# 类型检查
pnpm type-check

# 目录结构检查
tree src -L 3
tree types -L 1
tree examples -L 2
```

### 11.2 验收清单

```bash
# 项目结构
✅ src/runtime/server/middleware/ 存在
✅ src/runtime/server/streaming/ 存在
✅ src/runtime/client/ 存在
✅ src/runtime/shared/ 存在
✅ src/build/ 存在
✅ src/cli/ 存在
✅ examples/basic/pages/ 存在
✅ types/ 存在
✅ config/ 存在

# 依赖
✅ node_modules/ 存在
✅ pnpm-lock.yaml 存在

# TypeScript 配置
✅ tsconfig.json 存在
✅ tsconfig.server.json 存在
✅ tsconfig.client.json 存在
✅ tsconfig.build.json 存在
✅ examples/basic/tsconfig.json 存在

# 类型定义
✅ types/global.d.ts 存在
✅ types/framework.d.ts 存在
✅ types/webpack.d.ts 存在
✅ RequestContext 包含 security、trace、log、abortController、responseMode
✅ Logger 接口定义（debug、info、warn、error）
✅ StreamRenderOptions 包含 streaming 配置（revealStrategy、shellTimeout、boundaryPrefix）
✅ SuspenseBoundary 接口定义
✅ RouteDeps 接口定义（js、css、preload、prefetch）

# 安全与可观测性
✅ src/runtime/server/security.ts 存在
✅ src/runtime/server/headers.ts 存在
✅ src/runtime/server/logger.ts 存在
✅ src/runtime/server/middleware/context.ts 存在
✅ generateNonce() 函数实现
✅ injectScript() 函数实现
✅ sanitizeJSON() 函数实现
✅ ResponseHeaders 类实现
✅ RequestLogger 类实现
✅ 日志输出包含 requestId

# 配置文件
✅ tailwind.config.js 存在
✅ postcss.config.js 存在
✅ .gitignore 存在
✅ .env.example 存在
✅ examples/basic/app.config.ts 存在
✅ app.config.ts 包含 security、observability、streaming 配置

# 示例页面
✅ examples/basic/pages/index.tsx 存在

# 最终检查
✅ pnpm type-check 无错误
✅ 所有新增类型定义完整（Logger、StreamRenderOptions、SuspenseBoundary、RouteDeps）
✅ 所有架构决策文档化（接口定义在 Phase 0，实现可后延）
✅ Git 仓库提交所有更改
```

---

## 🎉 Phase 0 完成！

恭喜！你已经完成了 Phase 0 的所有任务。

**下一步：Phase 1 - 基础 SSR**
- 实现 React 服务端渲染（renderToString）
- Webpack 双端构建
- Koa 服务器
- 客户端水合

参考 `ROADMAP.md` 的 Phase 1 章节开始实施。
