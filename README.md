# React 19.2 SSR 框架

一个基于 React 19.2 从零构建的现代化、生产就绪的服务端渲染框架，支持流式 SSR、热模块替换和边缘运行时兼容。

## 特性

### 核心能力

- **流式 SSR** - 使用 `renderToPipeableStream`（Node.js）和 `renderToReadableStream`（Edge Runtime）实现渐进式 HTML 渲染
- **文件系统路由** - 从 `pages/` 目录自动生成路由，支持动态路由
- **React 19 数据获取** - 内置 `use()` Hook 集成，支持服务端预取和客户端水合
- **热模块替换** - 双服务器架构，支持 React Fast Refresh 实现即时更新
- **边缘运行时就绪** - 兼容 Vercel Edge、Cloudflare Workers 和 Deno Deploy
- **TypeScript 优先** - 严格模式，提供完整的类型定义

### 安全与性能

- **请求级 CSP** - 基于 Nonce 的内容安全策略，防止 XSS 攻击
- **内置可观测性** - 请求追踪、性能标记和 Server-Timing 响应头
- **性能优化** - TTFB < 120ms，Shell 就绪时间 ~115ms

## 技术栈

- **React** 19.2
- **构建工具** Webpack 5
- **服务器** Koa
- **路由** React Router v6 + 文件系统路由
- **样式** Tailwind CSS
- **语言** TypeScript（严格模式）

## 快速开始

### 前置要求

- Node.js >= 18
- pnpm（推荐）或 npm

### 安装

```bash
# 克隆仓库
git clone <repository-url>
cd react19-ssr-project

# 安装依赖
pnpm install
```

### 开发

```bash
# 启动双服务器架构（HMR + SSR）
# HMR 服务器: http://localhost:3001
# SSR 服务器: http://localhost:3000
pnpm dev
```

### 生产

```bash
# 构建生产版本
pnpm build

# 启动生产服务器（默认启用流式 SSR）
pnpm start

# 强制指定运行时
SSR_RUNTIME=node pnpm start    # Node.js（默认）
SSR_RUNTIME=edge pnpm start    # Edge Runtime
```

### 类型检查

```bash
pnpm type-check
```

## 项目结构

```
react19-ssr-project/
├── src/
│   ├── runtime/              # 框架运行时
│   │   ├── server/           # SSR 渲染引擎、流式适配器
│   │   ├── client/           # 客户端水合和路由
│   │   └── shared/           # 共享工具（类型、数据获取）
│   ├── build/                # Webpack 配置和构建工具
│   │   ├── webpack.*.ts      # 客户端/服务端/开发环境配置
│   │   └── route-scanner.ts  # 文件系统路由扫描器
│   └── cli/                  # 命令行工具
├── examples/basic/           # 示例应用
│   └── pages/                # 文件系统路由目录
│       ├── index.tsx         # / 路由
│       ├── about.tsx         # /about 路由
│       └── blog/[id].tsx     # /blog/:id 动态路由
├── types/                    # TypeScript 类型定义
└── docs/                     # 文档
    ├── ROADMAP.md            # 实施路线图
    ├── HMR.md                # HMR 架构
    └── PAGE_LOADER.md        # 页面加载系统
```

## 创建页面

页面会通过文件系统路由自动转换为路由：

```
pages/index.tsx           → /
pages/about.tsx           → /about
pages/blog/[id].tsx       → /blog/:id
pages/admin/users.tsx     → /admin/users
```

### 基础页面组件

```tsx
// pages/about.tsx
export default function About() {
  return (
    <div>
      <h1>关于页面</h1>
      <p>这是一个静态页面</p>
    </div>
  )
}
```

### 动态路由与数据获取

```tsx
// pages/blog/[id].tsx
import { use, Suspense } from 'react'
import { useParams } from 'react-router-dom'

function BlogContent({ id }: { id: string }) {
  const data = use(fetchBlog(id))
  return (
    <article>
      <h1>{data.title}</h1>
      <p>{data.content}</p>
    </article>
  )
}

export default function BlogPost() {
  const params = useParams()
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <BlogContent id={params.id!} />
    </Suspense>
  )
}
```

## 数据获取

框架使用 React 19 的 `use()` Hook，支持自动服务端预取：

```tsx
import { use } from 'react'
import { createResource } from '@/runtime/shared/data-fetching'

// 创建带缓存的资源
const fetchUser = createResource(async (id: string) => {
  const res = await fetch(`https://api.example.com/users/${id}`)
  return res.json()
})

function UserProfile({ id }: { id: string }) {
  const user = use(fetchUser(id))  // 服务端：await，客户端：复用缓存数据
  return <div>{user.name}</div>
}
```

**工作原理：**
- 服务端：Promise 被等待并序列化到 `window.__INITIAL_DATA__`
- 客户端：从 `window.__INITIAL_DATA__` 复用数据，无需重复请求
- 请求去重：追踪进行中的请求，防止重复获取

## 流式 SSR

框架支持两种流式 API 以适配不同运行时环境：

### Node.js 运行时（默认）

```bash
SSR_RUNTIME=node pnpm start
```

使用 `react-dom/server.node` 的 `renderToPipeableStream` 以获得最佳 Node.js 性能。

### Edge 运行时

```bash
SSR_RUNTIME=edge pnpm start
```

使用 `react-dom/server.browser` 的 `renderToReadableStream` 以兼容边缘环境（Vercel Edge、Cloudflare Workers、Deno Deploy）。

### 统一接口

框架通过 `src/runtime/server/streaming/adapter.ts` 自动检测运行时并使用相应的流式 API。

## 热模块替换

开发服务器使用双服务器架构：

- **HMR 服务器（端口 3001）**：Webpack 开发服务器，负责热更新
- **SSR 服务器（端口 3000）**：Koa 服务器，负责渲染

**功能特性：**
- 客户端：无需刷新页面即可热更新（保留状态）
- 服务端：通过 nodemon 自动重启
- React Fast Refresh：组件级热重载

详见 [docs/HMR.md](./docs/HMR.md) 架构文档。

## 性能

### 当前指标（流式 SSR）

| 指标 | 目标 | 当前 |
|--------|--------|---------|
| TTFB | < 200ms | ~120ms |
| Shell 就绪 | - | ~115ms |
| 完整渲染 | - | ~184ms |
| FCP | < 1s | ✓ |
| LCP | < 2.5s | ✓ |

## 开发状态

**当前阶段**：Phase 5 ✅ 已完成 - HMR + React Fast Refresh

**已完成阶段：**
- ✅ Phase 0：项目初始化
- ✅ Phase 1：基础 SSR（renderToString）
- ✅ Phase 2：文件系统路由
- ✅ Phase 2.5：React Router v6 迁移
- ✅ Phase 3：流式 SSR（Node.js + Edge Runtime）
- ✅ Phase 4：使用 `use()` Hook 的数据获取
- ✅ Phase 5：HMR + React Fast Refresh

**即将到来的阶段：**
- Phase 6：中间件系统
- Phase 7：错误处理 + 开发者工具
- Phase 8：CLI 工具
- Phase 9：性能优化
- Phase 10：部分预渲染（PPR）

完整实施计划详见 [docs/ROADMAP.md](./docs/ROADMAP.md)。

## 配置

### TypeScript 配置

项目使用 5 个独立的 `tsconfig.json` 文件：

1. `tsconfig.json` - 根配置（严格模式、路径）
2. `tsconfig.server.json` - 服务端（CommonJS）
3. `tsconfig.client.json` - 客户端（ESM）
4. `tsconfig.build.json` - 构建工具
5. `examples/basic/tsconfig.json` - 用户项目

### 环境变量

| 变量 | 可选值 | 描述 |
|----------|--------|-------------|
| `NODE_ENV` | `development` \| `production` | 环境模式 |
| `SSR_RUNTIME` | `node` \| `edge` \| `auto` | 强制指定运行时检测 |

## 浏览器与运行时支持

- **浏览器**：Chrome/Edge ≥ 90、Firefox ≥ 88、Safari ≥ 14
- **Node.js**：>= 18
- **边缘运行时**：Vercel Edge、Cloudflare Workers、Deno Deploy

## 架构亮点

### 安全基础设施

- **请求级 CSP nonce**：XSS 防护
- **XSS 安全的 JSON 序列化**：安全的数据注入
- **严格的脚本注入策略**：所有脚本必须使用 nonce

### 可观测性

- **请求追踪**：X-Request-ID
- **性能标记**：TTFB、shell 和完整渲染
- **Server-Timing 响应头**：详细的性能指标

### 统一上下文

每个请求都可以访问：

```typescript
interface RequestContext {
  security: {
    nonce: string
    sanitizeJSON: (data: any) => string
  }
  trace: {
    id: string
    startTime: number
    marks: Map<string, number>
  }
  abortController: AbortController
  responseMode: 'stream' | 'static' | 'ppr'
}
```

## 文档

- [ROADMAP.md](./docs/ROADMAP.md) - 实施路线图与里程碑
- [HMR.md](./docs/HMR.md) - 热模块替换架构
- [PAGE_LOADER.md](./docs/PAGE_LOADER.md) - 页面加载系统
- [CLAUDE.md](./CLAUDE.md) - 开发者指南

## 贡献

这目前是一个个人项目，欢迎贡献、提出问题和功能请求！

## 许可证

MIT

---

使用 React 19.2 构建
