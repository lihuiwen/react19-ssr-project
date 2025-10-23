# React 19.2 SSR 框架实现路线图

> 一个支持流式渲染、边缘运行时兼容的现代化 React SSR 框架

## 技术选型总结

```yaml
核心技术栈:
  构建工具: Webpack 5
  服务端: Koa
  路由: 文件系统路由 + API路由
  样式: Tailwind CSS
  数据获取: use() Hook (React 19)
  项目结构: 单包结构

流式渲染:
  - renderToPipeableStream (Node.js)
  - renderToReadableStream (Edge Runtime)
  - 自动检测运行时环境

开发体验:
  - HMR 热更新
  - TypeScript 全栈支持
  - 错误边界处理
  - DevTools 集成

MVP 功能:
  - ✅ 流式 SSR 渲染（Suspense Streaming）
  - ✅ 中间件系统
  - ✅ Partial Pre-rendering（React 19.2 PPR）
```

## 项目结构

```
react19-ssr-framework/
├── src/
│   ├── runtime/              # 运行时代码
│   │   ├── server/           # 服务端渲染引擎
│   │   │   ├── render.tsx    # 流式渲染核心
│   │   │   ├── router.ts     # 路由匹配
│   │   │   ├── middleware.ts # 中间件管理
│   │   │   └── streaming/    # 流式渲染适配器
│   │   │       ├── adapter.ts
│   │   │       ├── node.ts   # renderToPipeableStream
│   │   │       ├── web.ts    # renderToReadableStream
│   │   │       ├── prerender.ts  # PPR 预渲染（Phase 10.5）
│   │   │       ├── resume.ts     # PPR 恢复渲染（Phase 10.5）
│   │   │       └── ppr-cache.ts  # PPR 缓存系统（Phase 10.5）
│   │   ├── client/           # 客户端入口
│   │   │   ├── hydrate.tsx   # 水合逻辑
│   │   │   ├── router.tsx    # 客户端路由
│   │   │   └── devtools.tsx  # 开发者工具
│   │   └── shared/           # 共享代码
│   │       ├── types.ts      # 类型定义
│   │       ├── data-fetching.ts  # 数据获取
│   │       └── i18n.ts       # 国际化工具（Phase 11）
│   ├── build/                # Webpack 配置
│   │   ├── webpack.common.ts # 公共配置
│   │   ├── webpack.client.ts # 客户端配置
│   │   ├── webpack.server.ts # 服务端配置
│   │   ├── webpack.dev.ts    # 开发配置
│   │   ├── dev-server.ts     # 开发服务器(HMR)
│   │   ├── route-scanner.ts  # 路由扫描器
│   │   ├── api-scanner.ts    # API 路由扫描
│   │   ├── ppr-analyzer.ts   # PPR 策略分析（Phase 10.5）
│   │   └── static-generator.ts # 构建时静态生成（Phase 10.5）
│   └── cli/                  # 命令行工具
│       ├── dev.ts            # npm run dev
│       ├── build.ts          # npm run build
│       └── start.ts          # npm run start
├── examples/                 # 示例项目
│   └── basic/
│       ├── pages/            # 文件系统路由
│       │   ├── index.tsx     # /
│       │   ├── about.tsx     # /about
│       │   ├── blog/
│       │   │   └── [id].tsx  # /blog/:id
│       │   └── api/          # API 路由
│       │       └── hello.ts  # /api/hello
│       ├── locales/          # i18n 翻译文件（Phase 11 可选）
│       │   ├── en.json
│       │   └── zh.json
│       ├── middleware.ts     # 全局中间件（Phase 7）
│       └── app.config.ts     # 应用配置
├── types/                    # TypeScript 类型定义
│   ├── global.d.ts
│   ├── framework.d.ts
│   └── webpack.d.ts
├── tsconfig.json             # TS 根配置
├── tsconfig.server.json      # 服务端配置
├── tsconfig.client.json      # 客户端配置
├── tsconfig.build.json       # 构建工具配置
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

## 实现路线图

### 总体原则
1. **按依赖关系排序**：后面的功能依赖前面的基础
2. **MVP 优先**：先让核心功能跑通，再完善细节
3. **增量开发**：每个阶段都能产出可运行的版本
4. **风险前置**：技术难点（流式渲染、HMR）优先攻克

### 关键里程碑

```
✅ Day 2:  项目脚手架完成
✅ Day 5:  基础 SSR 可运行
✅ Day 10: 路由和 API 完整
✅ Day 17: 流式 SSR + 数据获取 (核心MVP)
✅ Day 24: 完整开发体验 (HMR + 中间件)
✅ Day 30: 生产可用 (CLI + 错误处理)
✅ Day 32: 基础性能优化与文档
✅ Day 35: PPR 极致性能优化 (TTFB < 50ms)
✅ Day 40: 国际化支持，可发布
```

---

## Phase 0: 项目初始化 + TypeScript 配置 (Day 1-2)

**目标：搭建完整的开发环境和类型系统**

### 核心任务

#### 1. 项目结构初始化
```bash
mkdir react19-ssr-framework
cd react19-ssr-framework
pnpm init

# 创建目录结构
mkdir -p src/{runtime/{server,client,shared},build,cli}
mkdir -p examples/basic/{pages,public,locales}
mkdir -p types
```

#### 2. TypeScript 配置（5个配置文件）

- **tsconfig.json**：根配置，严格模式
- **tsconfig.server.json**：服务端（CommonJS）
- **tsconfig.client.json**：客户端（ESM）
- **tsconfig.build.json**：构建工具
- **examples/basic/tsconfig.json**：用户项目

#### 3. 类型定义文件

- **types/global.d.ts**：全局类型（环境变量、模块声明）
- **types/framework.d.ts**：框架核心类型（Route、Loader、Middleware）
- **types/webpack.d.ts**：Webpack 相关类型

#### 4. 依赖安装

核心依赖：
- `react@^19.0.0`
- `react-dom@^19.0.0`
- `koa@^2.15.0`
- `webpack@^5.89.0`
- `typescript@^5.3.3`
- `tailwindcss@^3.4.0`

#### 5. 配置文件

- Tailwind CSS + PostCSS
- ESLint + Prettier
- Git (.gitignore)
- 环境变量 (.env.example)

#### 6. 示例页面

创建 `examples/basic/pages/index.tsx`（虽然还不能运行）

### 验收标准

```bash
✅ pnpm install 成功安装所有依赖
✅ pnpm type-check 无 TypeScript 错误
✅ 项目结构完整，所有配置文件就位
✅ 能导入并使用框架类型定义
✅ Git 仓库初始化完成
✅ 示例页面文件创建
```

### 输出物

- package.json（完整依赖）
- 5 个 tsconfig 文件
- 3 个类型定义文件
- 所有配置文件
- README.md
- 完整目录结构

---

## Phase 1: 基础 SSR (Day 3-5)

**目标：实现最简单的 React SSR（非流式）**

### 核心任务

#### 1. React 服务端渲染
- 使用 `renderToString`（先不用流式）
- HTML 模板注入
- 静态资源路径处理

#### 2. 客户端水合
- `hydrateRoot` 基础实现
- 确保服务端/客户端内容一致
- 验证事件绑定生效

#### 3. Webpack 双端构建
- 客户端打包输出 `client.js`
- 服务端打包输出 `server.js`
- 生成 `manifest.json`（资源映射）

#### 4. Koa 服务器
- 基础 HTTP 服务器
- 静态资源服务
- SSR 路由处理

### 验收标准

```bash
✅ 服务端渲染 React 组件
✅ 客户端水合成功（console 无 hydration 警告）
✅ 按钮点击等交互正常
✅ 查看源代码能看到完整 HTML
✅ Tailwind 样式生效
```

### 输出物

- `src/runtime/server/render.tsx`
- `src/runtime/client/hydrate.tsx`
- `src/build/webpack.*.ts`（3个配置）
- `src/cli/dev.ts`（基础版）
- 可交互的 React SSR 应用

---

## Phase 2: 文件系统路由 (Day 6-8)

**目标：实现约定式路由，支持动态路由**

### 核心任务

#### 1. 路由扫描器
- 构建时扫描 `pages/` 目录
- 生成路由配置文件 `.routes.json`
- 支持动态路由 `[id].tsx → :id`

#### 2. 服务端路由匹配
- 根据 URL 匹配对应组件
- 提取路由参数（params）
- 404 处理

#### 3. 客户端路由
- 客户端路由跳转（pushState）
- `<Link>` 组件实现
- 路由切换时组件更新

#### 4. 测试路由
- `/`（首页）
- `/about`（静态路由）
- `/blog/[id]`（动态路由）

### 验收标准

```bash
✅ 创建 pages/about.tsx 自动生成路由
✅ /blog/123 能正确渲染并获取 params.id
✅ Link 点击跳转无刷新
✅ 浏览器前进/后退正常
```

### 输出物

- `src/build/route-scanner.ts`
- `src/runtime/router/router.tsx`
- `src/runtime/router/Link.tsx`
- `src/runtime/shared/route-context.tsx`

---

## Phase 3: API 路由 (Day 9-10)

**目标：支持 pages/api/ 目录作为后端接口**

### 核心任务

#### 1. API 路由扫描
- 扫描 `pages/api/*.ts`
- 注册到 Koa 路由

#### 2. API Handler 处理
- `export default function handler(ctx) {}`
- 支持 GET/POST/PUT/DELETE
- 自动解析 JSON body

#### 3. 示例 API
- `/api/hello`（静态数据）
- `/api/posts/[id]`（动态参数）

### 验收标准

```bash
✅ /api/hello 返回 JSON
✅ /api/posts/123 能获取 params.id
✅ POST 请求能接收 body 数据
✅ API 错误处理正常
```

### 输出物

- `src/build/api-scanner.ts`
- `src/runtime/server/api-handler.ts`

---

## Phase 4: 流式 SSR (Day 11-14) ⚠️ 核心难点

**目标：升级到 Streaming SSR，支持 Suspense，兼容双运行时**

### 核心任务

#### 1. 统一流式渲染适配器
- `NodeStreamResult`（renderToPipeableStream）
- `WebStreamResult`（renderToReadableStream）
- 自动检测运行时环境

#### 2. 替换渲染引擎
- `renderToString` → `renderToPipeableStream/renderToReadableStream`
- 处理 Node.js Stream 到 Koa
- HTML 流式输出策略

#### 3. Suspense 支持
- 服务端 Suspense 边界识别
- 发送 fallback + 替换脚本
- 客户端 Selective Hydration

#### 4. 错误处理
- Suspense 错误边界
- 流式渲染中断恢复
- `onError` 回调

#### 5. 边缘运行时支持（可选）
- Vercel Edge Functions
- Cloudflare Workers
- Deno Deploy

### 流式渲染策略

```html
<!-- HTML Shell 流式输出 -->
1. 立即发送 <head> + 初始 <body>
2. Suspense 边界：
   - 先发送 <template id="B:1">...</template> (fallback)
   - 数据加载完成后发送替换脚本
3. 最后发送 </body></html>
```

### 验收标准

```bash
✅ Node.js 环境使用 renderToPipeableStream
✅ 边缘环境使用 renderToReadableStream
✅ 配置 runtime: 'auto' 自动选择
✅ 页面分段加载（Network 面板看到分段响应）
✅ Suspense fallback 显示后被替换
✅ 客户端水合仅针对已加载部分
✅ 慢接口不阻塞整个页面渲染
```

### 输出物

- `src/runtime/server/streaming/adapter.ts`
- `src/runtime/server/streaming/node.ts`
- `src/runtime/server/streaming/web.ts`
- `src/runtime/client/selective-hydrate.tsx`

---

## Phase 5: 数据获取 use() Hook (Day 15-17)

**目标：实现 React 19 use() Hook 数据流**

### 核心任务

#### 1. Promise 资源管理
- 创建可复用的 Promise 资源
- 服务端预取数据
- 序列化数据到 HTML（`window.__INITIAL_DATA__`）

#### 2. use() Hook 集成
- 服务端：`await promise`
- 客户端：从 `window.__INITIAL_DATA__` 恢复
- 客户端导航：重新 fetch

#### 3. 数据预取优化
- 并行数据请求
- 请求去重
- 缓存策略

### 使用示例

```typescript
// pages/blog/[id].tsx
import { use, Suspense } from 'react'

function BlogPost({ params }) {
  return (
    <Suspense fallback={<Skeleton />}>
      <BlogContent id={params.id} />
    </Suspense>
  )
}

function BlogContent({ id }) {
  const data = use(fetchBlog(id)) // React 19 use()
  return <article>{data.content}</article>
}
```

### 验收标准

```bash
✅ 服务端能 await 异步数据
✅ 客户端水合时不重复请求
✅ 客户端路由跳转时重新获取数据
✅ Suspense 配合 use() 正常工作
✅ 错误边界捕获数据获取错误
```

### 输出物

- `src/runtime/shared/data-fetching.ts`
- `src/runtime/shared/use-hook.ts`
- `src/runtime/shared/resource.ts`

---

## Phase 6: 开发服务器 + HMR (Day 18-22) ⚠️ 复杂功能

**目标：实现热更新，提升开发体验**

**⚠️ 重要：完全参考 `HMR.md` 中的双服务器架构方案**

### 架构设计（基于 HMR.md）

采用**双服务器分离架构**：

```
HMR Server (Port 3001)          SSR Server (Port 3000)
├── Express                     ├── Koa
├── Webpack Dev Middleware      ├── SSR Rendering
├── Webpack Hot Middleware      ├── Require Cache 清理
└── SSE 推送更新                └── Nodemon 监听服务端代码
```

### 核心任务

#### 1. HMR 服务器（Port 3001）
- Express + `webpack-dev-middleware`
- `webpack-hot-middleware`（SSE 推送）
- 编译客户端代码到 `dist/client/`
- 提供 `/__webpack_hmr` 端点
- `writeToDisk: true`（供 SSR 使用）

#### 2. SSR 服务器（Port 3000）
- Koa 服务端渲染
- 静态文件服务（`dist/client/`）
- Require cache 清理机制
- Nodemon 监听 `src/server/` 变化
- 优雅关闭处理（`SIGTERM`）

#### 3. 客户端 HMR 配置
- Webpack entry 指向 `http://localhost:3001/__webpack_hmr`
- `module.hot.accept()` 接受路由更新
- `hydrate` vs `render` 判断

#### 4. 启动脚本协调
- 编译服务端代码（watch 模式）
- 启动 HMR 服务器
- 延迟启动 SSR 服务器（确保 HMR 就绪）
- 进程管理和优雅关闭

#### 5. React Fast Refresh
- `@pmmmwh/react-refresh-webpack-plugin`
- 组件状态保持
- 错误恢复

### 验收标准

```bash
✅ 修改组件代码，页面无刷新更新（HMR）
✅ 组件 state 保持不丢失（React Fast Refresh）
✅ 修改服务端代码，SSR 服务器自动重启，HMR 连接不中断
✅ Network 面板显示 __webpack_hmr 连接到 3001 端口
✅ 控制台显示：🔥 Hot Module Replacement triggered
✅ 语法错误显示友好提示（error overlay）
✅ Tailwind 类名修改立即生效
✅ 无 ERR_INCOMPLETE_CHUNKED_ENCODING 错误
✅ 无端口占用错误（EADDRINUSE）
```

### 输出物

**参考 HMR.md 实现以下文件：**

- `src/server/hmr-server.js`（HMR 服务器 - Express）
- `src/server/dev-server.js`（SSR 服务器 - Koa）
- `scripts/dev.js`（启动脚本协调器）
- `config/webpack.client.js`（HMR 客户端配置）
- `src/client/index.js`（HMR 客户端入口）

**工作流程详见 `HMR.md` 的完整文档**

---

## Phase 7: 中间件系统 (Day 23-24)

**目标：实现请求拦截和处理链**

### 核心任务

#### 1. 中间件加载器
- 读取 `middleware.ts`
- 注册到 Koa
- 支持条件匹配（matcher）

#### 2. 内置中间件
- Logger（请求日志）
- CORS
- Static（静态文件）

#### 3. 中间件组合
- 链式调用
- 错误处理

### 使用示例

```typescript
// middleware.ts
export const middleware: Middleware[] = [
  // 日志中间件
  async (ctx, next) => {
    const start = Date.now()
    await next()
    console.log(`${ctx.method} ${ctx.url} - ${Date.now() - start}ms`)
  },

  // 鉴权中间件
  {
    matcher: /^\/admin/,
    handler: async (ctx, next) => {
      if (!ctx.headers.authorization) {
        ctx.status = 401
        return
      }
      await next()
    }
  }
]
```

### 验收标准

```bash
✅ 自定义中间件生效
✅ 能拦截特定路径
✅ 中间件执行顺序正确
✅ 错误中间件捕获异常
```

### 输出物

- `src/runtime/server/middleware-loader.ts`
- `src/runtime/server/built-in-middleware.ts`

---

## Phase 8: 错误处理 + DevTools (Day 25-27)

**目标：完善开发体验和错误提示**

### 核心任务

#### 1. 错误边界
- 全局 `ErrorBoundary`
- 路由级错误边界
- 开发/生产模式不同展示

#### 2. DevTools
- 路由信息面板
- 数据获取状态
- 性能指标（TTFB、FCP）

#### 3. 友好错误提示
- 404 页面
- 500 错误页面
- Error Overlay（开发模式）

### 验收标准

```bash
✅ 组件错误不崩溃整个应用
✅ 开发模式显示详细堆栈
✅ 生产模式显示友好错误页
✅ DevTools 显示路由和性能数据
✅ 404 页面可自定义
```

### 输出物

- `src/runtime/shared/error-boundary.tsx`
- `src/runtime/client/devtools.tsx`
- `src/runtime/shared/error-pages.tsx`

---

## Phase 9: CLI 工具 (Day 28-30)

**目标：完善命令行工具**

### 核心任务

#### 1. 命令实现
- `dev`（开发服务器）
- `build`（生产构建）
- `start`（启动生产服务器）
- `create`（创建新项目）

#### 2. 配置文件
- `app.config.ts`（用户配置）
- 端口、路径等自定义
- 插件系统预留

#### 3. 终端美化
- 彩色日志
- 进度条
- 启动信息展示

### 验收标准

```bash
✅ npm run dev 启动开发服务器
✅ npm run build 输出生产文件
✅ npm run start 启动生产服务器
✅ 命令行输出美观清晰
✅ 错误信息友好提示
```

### 输出物

- `src/cli/dev.ts`
- `src/cli/build.ts`
- `src/cli/start.ts`
- `src/cli/create.ts`
- `src/cli/utils/logger.ts`

---

## Phase 10: 基础性能优化与文档 (Day 31-32)

**目标：基础性能优化和文档完善**

### 核心任务

#### 1. 基础性能优化
- 代码分割（`React.lazy`）
- 资源预加载（`<link rel="preload">`）
- 静态资源 CDN
- 压缩（gzip/brotli）

#### 2. 文档编写
- README（快速开始）
- API 文档
- 最佳实践
- 部署指南

#### 3. 示例项目
- Blog 示例
- Dashboard 示例
- E-commerce 示例

### 验收标准

```bash
✅ Lighthouse 得分 > 90
✅ 首屏加载 < 1s
✅ 文档覆盖所有核心功能
✅ 示例项目可直接运行
✅ 部署到 Vercel/Cloudflare 成功
```

### 输出物

- 构建优化配置
- 完整项目文档
- 3个示例项目

---

## Phase 10.5: Partial Pre-rendering (PPR) 支持 (Day 33-35) ⚠️ 高级特性

**目标：实现 React 19.2 两阶段渲染，极致性能优化**

> 基于 React 19.2 的 `prerender()`, `resume()`, `resumeAndPrerender()` APIs

### 技术背景

React 19.2 引入了 **Partial Pre-rendering (PPR)**，通过两阶段渲染模式实现：
1. **Stage 1 - prerender()**: 生成静态 HTML 壳子，遇到动态 Suspense 边界时中止，返回 `postponed` 状态
2. **Stage 2 - resume() / resumeAndPrerender()**:
   - `resume()` → 恢复为 SSR 流（动态内容）
   - `resumeAndPrerender()` → 恢复为完整静态 HTML（SSG）

### 核心任务

#### 1. Prerender 预渲染引擎

**实现统一的预渲染接口**：

```typescript
// src/runtime/server/streaming/prerender.ts
import { prerender } from 'react-dom/static'
import { prerenderToNodeStream } from 'react-dom/server.node'

export async function prerenderPage(
  Component: React.ComponentType,
  options: PrerenderOptions
): Promise<PrerenderResult> {
  const { prelude, postponed } = await (
    options.runtime === 'node'
      ? prerenderToNodeStream(<Component />, {
          bootstrapScripts: options.scripts,
          signal: AbortSignal.timeout(options.timeout || 5000),
          onError: options.onError,
        })
      : prerender(<Component />, {
          bootstrapScripts: options.scripts,
          signal: AbortSignal.timeout(options.timeout || 5000),
          onError: options.onError,
        })
  )

  return { prelude, postponed }
}
```

**关键功能**：
- 自动检测 Suspense 边界
- 超时控制（默认 5s）
- 错误处理和降级
- 双运行时支持（Node.js / Edge）

#### 2. Resume 恢复渲染引擎

**实现双模式恢复**：

```typescript
// src/runtime/server/streaming/resume.ts
import { resume, resumeAndPrerender } from 'react-dom/static'
import {
  resumeToPipeableStream,
  resumeAndPrerenderToNodeStream
} from 'react-dom/server.node'

// 模式 A: 恢复为 SSR 流（动态内容）
export async function resumeToSSR(
  Component: React.ComponentType,
  postponedState: PostponedState,
  runtime: 'node' | 'edge'
) {
  if (runtime === 'node') {
    return resumeToPipeableStream(<Component />, postponedState, {
      onShellReady() { /* ... */ },
      onError(error) { /* ... */ }
    })
  } else {
    return resume(<Component />, postponedState, {
      signal: AbortSignal.timeout(10000),
      onError(error) { /* ... */ }
    })
  }
}

// 模式 B: 恢复为完整静态 HTML（SSG）
export async function resumeToStatic(
  Component: React.ComponentType,
  postponedState: PostponedState,
  runtime: 'node' | 'edge'
) {
  if (runtime === 'node') {
    return resumeAndPrerenderToNodeStream(<Component />, postponedState)
  } else {
    return resumeAndPrerender(<Component />, postponedState)
  }
}
```

#### 3. PostponedState 缓存系统

**支持多种存储后端**：

```typescript
// src/runtime/server/streaming/ppr-cache.ts
export interface PPRCache {
  get(key: string): Promise<PostponedState | null>
  set(key: string, state: PostponedState, ttl?: number): Promise<void>
  delete(key: string): Promise<void>
}

export class RedisPPRCache implements PPRCache {
  async get(key: string) {
    const json = await redis.get(`ppr:${key}`)
    return json ? JSON.parse(json) : null
  }

  async set(key: string, state: PostponedState, ttl = 3600) {
    await redis.setex(`ppr:${key}`, ttl, JSON.stringify(state))
  }
}

export class FileSystemPPRCache implements PPRCache {
  // 存储到 .cache/ppr/{route-hash}.json
}

export class MemoryPPRCache implements PPRCache {
  // 内存 LRU 缓存
}
```

#### 4. 构建时 PPR 策略分析

**自动检测路由的 PPR 策略**：

```typescript
// src/build/ppr-analyzer.ts
export interface PPRRouteConfig {
  path: string
  strategy: 'static' | 'dynamic' | 'hybrid' | 'auto'
  hasPostponed: boolean
  suspenseBoundaries: string[]
}

export function analyzePPRBoundaries(routes: Route[]): PPRRouteConfig[] {
  return routes.map(route => {
    const component = loadComponent(route.filePath)

    return {
      path: route.path,
      strategy: detectStrategy(component),
      hasPostponed: hasSuspenseBoundaries(component),
      suspenseBoundaries: extractSuspenseBoundaries(component)
    }
  })
}

function detectStrategy(component: any): PPRStrategy {
  // 检测组件是否有数据获取（use Hook、async Server Component）
  const hasDataFetching = hasUseHook(component) || hasAsyncComponent(component)

  // 检测是否有 Suspense 边界
  const hasSuspense = hasSuspenseBoundaries(component)

  if (!hasDataFetching && !hasSuspense) return 'static'
  if (hasDataFetching && !hasSuspense) return 'dynamic'
  if (hasSuspense) return 'hybrid'

  return 'auto'
}
```

#### 5. 路由级 PPR 配置

**页面组件配置**：

```typescript
// pages/blog/[id].tsx
import { Suspense, use } from 'react'

// 导出 PPR 配置
export const config = {
  ppr: {
    enabled: true,
    strategy: 'hybrid', // 'static' | 'dynamic' | 'hybrid' | 'auto'
    timeout: 3000,      // prerender 超时时间
    cache: {
      enabled: true,
      ttl: 3600,        // postponed 状态缓存 1 小时
    }
  }
}

export default function BlogPost({ params }: { params: { id: string } }) {
  return (
    <article>
      {/* 静态部分：立即渲染并缓存 */}
      <header className="blog-header">
        <h1>Blog Post</h1>
        <nav>...</nav>
      </header>

      {/* 动态部分：postponed，resume 时渲染 */}
      <Suspense fallback={<BlogSkeleton />}>
        <BlogContent id={params.id} />
      </Suspense>

      {/* 静态部分：立即渲染 */}
      <footer>...</footer>
    </article>
  )
}

function BlogContent({ id }: { id: string }) {
  const post = use(fetchBlogPost(id)) // 触发 postponed
  return <div dangerouslySetInnerHTML={{ __html: post.content }} />
}
```

#### 6. 应用配置扩展

```typescript
// app.config.ts
export default {
  server: {
    port: 3000,
    runtime: 'auto',

    // 新增 PPR 配置
    ppr: {
      enabled: true,
      defaultStrategy: 'auto', // 默认策略
      timeout: 5000,           // 全局 prerender 超时

      cache: {
        type: 'redis',         // 'memory' | 'redis' | 'filesystem'
        ttl: 3600,             // 默认缓存时长（秒）

        // Redis 配置
        redis: {
          host: 'localhost',
          port: 6379,
          db: 0,
        },

        // 文件系统配置
        filesystem: {
          cacheDir: '.cache/ppr',
        }
      },

      // 路径级覆盖
      routes: {
        '/blog/*': {
          strategy: 'hybrid',
          timeout: 3000,
        },
        '/api/*': {
          strategy: 'dynamic', // API 路由永不预渲染
        },
        '/': {
          strategy: 'static',  // 首页完全静态
        }
      }
    }
  }
}
```

#### 7. 渲染流程集成

**更新服务端渲染入口**：

```typescript
// src/runtime/server/render.tsx
import { prerenderPage } from './streaming/prerender'
import { resumeToSSR, resumeToStatic } from './streaming/resume'
import { PPRCache } from './streaming/ppr-cache'

export async function renderPage(url: string, ctx: Context) {
  const route = matchRoute(url)
  const pprConfig = route.config?.ppr || appConfig.server.ppr

  if (!pprConfig.enabled) {
    // 传统流式 SSR
    return streamingRender(route, ctx)
  }

  // PPR 模式
  const cacheKey = generateCacheKey(url)
  const cache = createPPRCache(pprConfig.cache.type)

  // 1. 尝试从缓存获取 postponed 状态
  let postponed = await cache.get(cacheKey)

  if (!postponed) {
    // 2. 首次渲染：prerender 生成静态壳子
    const { prelude, postponed: newPostponed } = await prerenderPage(
      route.component,
      {
        runtime: appConfig.server.runtime,
        timeout: pprConfig.timeout,
        scripts: ['/client.js'],
        onError: (error) => console.error('Prerender error:', error)
      }
    )

    // 3. 缓存 postponed 状态
    if (newPostponed) {
      await cache.set(cacheKey, newPostponed, pprConfig.cache.ttl)
      postponed = newPostponed
    }

    // 4. 立即返回静态壳子（TTFB < 50ms）
    ctx.type = 'text/html'
    ctx.body = prelude
  }

  // 5. Resume 动态内容（流式或静态）
  if (postponed) {
    const resumeStream = await resumeToSSR(
      route.component,
      postponed,
      appConfig.server.runtime
    )

    ctx.body = resumeStream
  }
}
```

### PPR 工作流程示例

#### 场景 A: 博客文章页（Hybrid 模式）

```
┌─────────────────────────────────────────────────┐
│ 1. 用户访问 /blog/123                            │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 2. prerender() 开始渲染                          │
│    ✅ <header> 立即渲染（静态）                   │
│    ⏸️  <BlogContent> 遇到 use(fetch)，postponed  │
│    ✅ <footer> 立即渲染（静态）                   │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 3. 返回静态 HTML 壳子（TTFB: ~50ms）              │
│    <html>                                        │
│      <header>...</header>                       │
│      <div id="blog-content">                    │
│        <Skeleton /> <!-- fallback -->           │
│      </div>                                     │
│      <footer>...</footer>                       │
│    </html>                                      │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 4. resume() 在后台完成数据获取                    │
│    - fetch('/api/blog/123') → 200ms              │
│    - 渲染 <BlogContent>                          │
│    - 流式推送替换脚本                             │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 5. 客户端接收流式更新，Selective Hydration       │
│    <script>                                     │
│      $RC("blog-content", "<article>...</article>")│
│    </script>                                    │
└─────────────────────────────────────────────────┘
```

#### 场景 B: 静态首页（Static 模式）

```
1. 构建时运行 resumeAndPrerender()
2. 生成完整静态 HTML 文件 → dist/index.html
3. 部署到 CDN（Cloudflare, Vercel Edge）
4. 用户访问：直接返回静态文件（TTFB < 20ms）
```

### 验收标准

```bash
# 性能指标
✅ 静态部分 TTFB < 50ms（从缓存/CDN 返回）
✅ 动态部分流式加载，不阻塞静态内容
✅ 首屏 LCP < 1s（静态壳子立即显示）
✅ Lighthouse 性能分数 > 95

# 功能验证
✅ prerender() 能正确识别 Suspense 边界并返回 postponed 状态
✅ postponed 状态可序列化并存储到 Redis/文件/内存
✅ resume() 能从 postponed 恢复并流式输出动态内容
✅ resumeAndPrerender() 能生成完整静态 HTML（SSG 模式）
✅ 构建时能自动分析路由的 PPR 策略（static/dynamic/hybrid）

# 缓存验证
✅ postponed 状态缓存生效，第二次请求 < 10ms
✅ Redis 缓存连接正常，支持 TTL 过期
✅ 文件系统缓存写入 .cache/ppr/*.json
✅ 内存缓存 LRU 淘汰机制正常

# 配置验证
✅ 页面级 config.ppr 覆盖全局配置
✅ 路径匹配规则生效（/blog/* → hybrid, /api/* → dynamic）
✅ timeout 超时后降级到传统 SSR
✅ disabled PPR 时回退到传统流式 SSR

# 边缘情况
✅ 网络错误时显示 fallback，不崩溃
✅ postponed 状态损坏时重新 prerender
✅ 缓存服务不可用时降级到无缓存模式
```

### 输出物

```
src/runtime/server/streaming/
├── prerender.ts              # prerender() 封装
├── resume.ts                 # resume() 和 resumeAndPrerender() 封装
└── ppr-cache.ts              # PostponedState 缓存系统

src/build/
├── ppr-analyzer.ts           # PPR 策略分析器
└── static-generator.ts       # 构建时静态生成

types/framework.d.ts
├── interface PPRConfig       # PPR 配置类型
├── interface PostponedState  # Postponed 状态类型
└── interface PrerenderResult # Prerender 结果类型

docs/
└── ppr.md                    # PPR 使用文档

examples/basic/
└── pages/
    ├── index.tsx             # 静态页面示例
    ├── blog/[id].tsx         # Hybrid 示例
    └── dashboard.tsx         # 动态页面示例
```

### 性能对比

| 模式 | TTFB | FCP | LCP | TTI |
|------|------|-----|-----|-----|
| 传统 SSR | ~200ms | ~800ms | ~2.5s | ~3s |
| 流式 SSR (Phase 4) | ~150ms | ~600ms | ~2s | ~2.5s |
| **PPR (Phase 10.5)** | **< 50ms** | **< 400ms** | **< 1s** | **< 1.5s** |

### 技术文档参考

- [React 19.2 - prerender API](https://react.dev/reference/react-dom/static/prerender)
- [React 19.2 - resume API](https://react.dev/reference/react-dom/static/resume)
- [React 19.2 - resumeAndPrerender API](https://react.dev/reference/react-dom/static/resumeAndPrerender)
- [React 19.2 Release Notes](https://react.dev/blog/2025/10/01/react-19-2)

---

## Phase 11: 国际化 i18n (Day 36-40)

**目标：支持多语言切换**

### 核心任务

#### 1. i18n 上下文
- `I18nProvider`（React Context）
- `useTranslation()` hook
- 支持嵌套 key（`home.title`）

#### 2. 语言检测
- Cookie 存储
- `Accept-Language` header
- URL 前缀（`/en/`, `/zh/`）

#### 3. 翻译文件加载
- `locales/en.json`
- 按需加载（代码分割）
- 热更新翻译文件

#### 4. SSR 集成
- 服务端注入 locale
- 客户端复用翻译数据

### 使用示例

```typescript
// locales/en.json
{
  "welcome": "Welcome to React SSR",
  "home": {
    "title": "Home Page"
  }
}

// pages/index.tsx
const { t } = useTranslation()
<h1>{t('welcome')}</h1>
<p>{t('home.title')}</p>
```

### 验收标准

```bash
✅ t('welcome') 显示对应语言
✅ 切换语言后页面更新
✅ 服务端渲染正确语言
✅ 客户端水合无语言闪烁
✅ URL 前缀路由正常工作
```

### 输出物

- `src/runtime/shared/i18n.tsx`
- `src/runtime/shared/i18n-provider.tsx`
- `src/runtime/shared/i18n-detector.ts`

---

## 后续升级：RSC 支持

### 升级路径（Phase 12+）

```typescript
// 为 RSC 预留的设计
1. 组件标记系统：'use client' / 'use server'
2. 序列化协议：React Flight Wire Format
3. 构建分离：Server Components Bundle vs Client Bundle
4. 新增 Webpack 插件：React Server Components Plugin

// 迁移成本评估：
- 路由系统：✅ 无需改动
- 数据获取：⚠️ 从 use() 升级到 async Server Components
- 构建配置：⚠️ 需要新增 RSC Webpack 插件
- 服务端：✅ Koa 继续适用
```

---

## 附录

### A. 配置文件示例

#### app.config.ts
```typescript
export default {
  server: {
    port: 3000,
    host: 'localhost',
    runtime: 'auto', // 'node' | 'edge' | 'auto'
    streaming: {
      shellTimeout: 5000,
      waitForAllReady: false,
    }
  },
  build: {
    outDir: 'dist',
    publicPath: '/',
    sourcemap: true,
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh'],
  }
}
```

### B. 性能指标

| 指标 | 目标 | 说明 |
|------|------|------|
| TTFB | < 200ms | 首字节时间 |
| FCP | < 1s | 首次内容绘制 |
| LCP | < 2.5s | 最大内容绘制 |
| TTI | < 3s | 可交互时间 |
| Hydration | < 500ms | 水合完成时间 |

### C. 浏览器兼容性

- Chrome/Edge ≥ 90
- Firefox ≥ 88
- Safari ≥ 14
- Node.js ≥ 18

---

## License

MIT
