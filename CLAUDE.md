# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important: Documentation Synchronization

**⚠️ When updating project status or completing phases:**

1. **docs/ROADMAP.md is the source of truth** for implementation details and phase status
2. **CLAUDE.md must be kept in sync** with docs/ROADMAP.md milestones
3. **Update both files** when:
   - Completing a phase (mark with ✅ in docs/ROADMAP.md)
   - Changing the current phase status
   - Adding new milestones or adjusting timelines
4. **Key sections to sync**:
   - "Current Phase" indicator
   - "Key Milestones" completion status
   - Any architectural changes from implementation learnings

## Project Overview

This is a **React 19.2 SSR (Server-Side Rendering) Framework** built from scratch with streaming SSR capabilities and edge runtime compatibility. The project follows a phased development approach detailed in `docs/ROADMAP.md`.

### Core Technology Stack

- **Build Tool**: Webpack 5
- **Server Framework**: Koa
- **Routing**: React Router v6 + File-system based routing
- **Styling**: Tailwind CSS
- **Data Fetching**: React 19 `use()` Hook
- **Streaming**: `renderToPipeableStream` (Node.js) and `renderToReadableStream` (Edge Runtime)
- **Language**: TypeScript (strict mode)

### Project Status

This is a **greenfield project** with **Phase 0 (project initialization)**, **Phase 1 (basic SSR)**, **Phase 2 (file-system routing)**, **Phase 2.5 (React Router v6 migration)**, **Phase 3 (Streaming SSR)**, **Phase 4 (Data Fetching)**, and **Phase 5 (HMR + React Fast Refresh)** completed. The framework now supports:

**Frontend Features**:
- Server-side rendering with both static (`renderToString`) and streaming (`renderToPipeableStream`/`renderToReadableStream`) modes
- React Router v6 for routing (StaticRouterProvider + RouterProvider)
- File-system based routing with automatic route generation from `pages/` directory
- Dynamic routes using `[param]` syntax (e.g., `pages/blog/[id].tsx`)
- Full Webpack build pipeline with route scanning

**Streaming SSR (Phase 3 完成)**:
- Dual runtime support: Node.js (`renderToPipeableStream`) and Edge Runtime (`renderToReadableStream`)
- Automatic runtime detection
- Progressive HTML rendering with `onShellReady` and `onAllReady` callbacks
- Performance tracking: TTFB < 120ms, shell ready in ~115ms
- Backward compatible with static SSR mode

**Data Fetching (Phase 4 完成)**:
- React 19 `use()` Hook integration for data fetching
- Promise resource management system with caching (TTL-based)
- Server-side data prefetching and serialization to `window.__INITIAL_DATA__.resources`
- Client-side hydration without duplicate requests
- Request deduplication (in-flight requests map)
- ErrorBoundary component for graceful error handling
- Example: `/products` page demonstrating Suspense + use() Hook

**HMR + React Fast Refresh (Phase 5 完成)**:
- Dual-server architecture: HMR Server (port 3001) + SSR Server (port 3000)
- Hot Module Replacement with React Fast Refresh support
- Client-side hot updates without page refresh (state preservation)
- Server-side hot reload with nodemon (automatic restart on changes)
- Webpack Dev Middleware + Hot Middleware for SSE-based updates
- React Refresh TypeScript transformer integration
- Graceful shutdown handling to prevent port conflicts
- See `docs/HMR.md` for detailed architecture documentation

**Error Handling & DevTools (Phase 7 已完成 - 2025-11-02)**:
- 404/500 error pages with custom support
- Global error handling middleware with inline CSS
- Error Overlay for development (ESC to close, HMR integration)
- ErrorBoundary with error reporting integration
- Route-level automatic error boundary wrapping
- Error reporting interface (ErrorReporter abstraction)
- Client-side global error handlers (window.onerror + unhandledrejection)
- DevTools panel with performance metrics (TTFB, FCP, LCP, Hydration)
- HMR status monitoring (status, update count, last update time)
- Error count tracking and Framework info display

**Current Phase**: Phase 7 ✅ Completed (100% completed - All 3 days done, 2025-11-02)

**Next Phase**: Phase 8 - CLI Tools (Phase 6 skipped)

Reference `docs/ROADMAP.md` for the complete implementation plan (Phase 0-10, ~38 days).

## Architecture

### High-Level Structure

The framework follows a **single-package structure** with clear separation of concerns:

```
src/
├── runtime/          # Core framework runtime
│   ├── server/       # SSR rendering engine, streaming adapters
│   ├── client/       # Client-side hydration and routing
│   └── shared/       # Shared utilities (types, data fetching)
├── build/            # Webpack configurations and build tools
│   ├── webpack.*.ts  # Client/server/dev configurations
│   └── route-scanner.ts
└── cli/              # Command-line interface (dev, build, start)

examples/basic/       # Example application
└── pages/            # File-system routing directory
    └── *.tsx         # Page components

types/                # TypeScript type definitions
```

### Dual Streaming Architecture

The framework supports two streaming APIs for different runtime environments:

1. **Node.js**: `renderToPipeableStream` (from `react-dom/server.node`)
   - Better performance in Node.js
   - Direct pipe to HTTP response

2. **Edge Runtime**: `renderToReadableStream` (from `react-dom/server.browser`)
   - Compatible with Vercel Edge, Cloudflare Workers, Deno Deploy
   - Web Streams API

**Unified Interface**: The `src/runtime/server/streaming/adapter.ts` provides automatic runtime detection and a consistent API across both modes.

### Security & Observability Infrastructure (Phase 0)

The framework implements **production-grade security and observability** from the ground up:

#### Request Context (ctx)

Every request has a unified context structure:

```typescript
interface RequestContext extends Context {
  security: {
    nonce: string                           // Request-scoped CSP nonce
    sanitizeJSON: (data: any) => string     // XSS-safe JSON serialization
  }
  trace: {
    id: string                              // X-Request-ID for tracing
    startTime: number                       // Request start timestamp
    marks: Map<string, number>              // Performance markers
  }
  abortController: AbortController          // Unified abort signal
  responseMode: 'stream' | 'static' | 'ppr' // Rendering strategy
  route?: { path, params, query }           // Route context (Phase 2+)
}
```

#### Security Utilities (security.ts)

- **`generateNonce()`**: Generates request-scoped CSP nonce (16 bytes base64)
- **`injectScript(content, { nonce })`**: Enforces nonce-based script injection (禁止裸 `<script>`)
- **`sanitizeJSON(data)`**: XSS-safe JSON serialization (escapes `<`, `>`, `&`)

**Strict Rule**: All `<script>` tags MUST use `injectScript()` with nonce. Direct `<script>` writing is prohibited.

```typescript
// ❌ NEVER do this
const html = `<script>window.__DATA__ = ${JSON.stringify(data)}</script>`

// ✅ ALWAYS use this
const html = injectScript(
  `window.__DATA__ = ${ctx.security.sanitizeJSON(data)}`,
  { nonce: ctx.security.nonce }
)
```

#### Response Headers (headers.ts)

The `ResponseHeaders` class is the **single source of truth** for all HTTP response headers:

- **CSP**: `Content-Security-Policy` with request-scoped nonce
- **Server-Timing**: Performance metrics (TTFB, shell, allReady)
- **Cache-Control**: Auto-configured based on `responseMode`
  - `static`: `public, max-age=31536000, immutable`
  - `ppr`: `public, max-age=3600, stale-while-revalidate=86400`
  - `stream`: `private, no-cache`
- **ETag**: Content hash for PPR cache validation
- **X-Request-ID**: Request tracing ID

**Usage Pattern**:
```typescript
const headers = new ResponseHeaders(ctx)
ctx.trace.marks.set('shell', Date.now() - ctx.trace.startTime)
// ... render HTML ...
headers.applyAll()  // Apply all headers at once
```

#### Context Injection Middleware

The `createContextMiddleware()` is the **first middleware** in the Koa app, injecting all context layers:

```typescript
app.use(createContextMiddleware())  // MUST be first
app.use(otherMiddleware())          // All other middleware access ctx.security, ctx.trace, etc.
```

### HMR Architecture (Phase 5)

The framework uses a **dual-server architecture** for Hot Module Replacement:

- **HMR Server (Port 3001)**: Express-based Webpack dev server
  - Compiles client code
  - Pushes updates via SSE (Server-Sent Events)
  - Serves `bundle.js` and hot-update files

- **SSR Server (Port 3000)**: Koa-based rendering server
  - Handles server-side rendering
  - Serves static files from `dist/`
  - Uses nodemon for server-side code changes

See `docs/HMR.md` for detailed documentation on the dual-server HMR setup.

### Partial Pre-rendering (PPR) Architecture (Phase 10.5)

The framework implements **React 19.2's two-stage rendering** for optimal performance:

**Stage 1 - Prerender**:
- Generate static HTML shell using `prerender()` or `prerenderToNodeStream()`
- Identify Suspense boundaries that require data fetching
- Return `postponed` state (serializable object) for later resumption
- Cache postponed state in Redis/Filesystem/Memory

**Stage 2 - Resume**:
- **SSR Mode**: Use `resume()` or `resumeToPipeableStream()` for streaming dynamic content
- **SSG Mode**: Use `resumeAndPrerender()` or `resumeAndPrerenderToNodeStream()` for complete static HTML

**Key Components**:
- `src/runtime/server/streaming/prerender.ts` - Unified prerender interface
- `src/runtime/server/streaming/resume.ts` - Dual-mode resume (SSR/SSG)
- `src/runtime/server/streaming/ppr-cache.ts` - Postponed state caching
- `src/build/ppr-analyzer.ts` - Build-time strategy detection

**Performance Benefits**:
- TTFB < 50ms (static shell from cache/CDN)
- LCP < 1s (instant visible content)
- Progressive enhancement (dynamic content streams in)

## Development Phases

The implementation follows these key milestones (from `docs/ROADMAP.md`):

### Phase Overview

| Phase | Days | Milestone | Status |
|-------|------|-----------|--------|
| 0 | 1-2 | Project initialization + TypeScript setup | ✅ Completed |
| 1 | 3-5 | Basic SSR (renderToString) | ✅ Completed |
| 2 | 6-8 | File-system routing | ✅ Completed |
| 2.5 | 9 | React Router v6 migration | ✅ Completed |
| 3 | 10 | **Streaming SSR** (core feature) | ✅ Completed |
| 4 | 11 | Data fetching with `use()` Hook | ✅ Completed |
| 5 | 15-19 | HMR + React Fast Refresh | ✅ Completed |
| 6 | - | ~~Middleware system~~ | ⏭️ **已跳过** |
| 7 | 22-24 | Error handling + DevTools | 🚧 **进行中** (67%) |
| 8 | 25-27 | CLI tools | - |
| 9 | 28-29 | Basic performance optimization + docs | - |
| 9.5 | 30-31 | **SEO Optimization** (optional) | - |
| 10 | 32-34 | **Partial Pre-rendering (PPR)** - React 19.2 | - |
| 11 | 35-37 | i18n (optional) | - |

### Key Milestones

- ✅ **Day 2**: 项目脚手架完成
- ✅ **Day 5**: 基础 SSR 可运行
- ✅ **Day 8**: 文件系统路由完整
- ✅ **Day 9**: React Router v6 迁移完成
- ✅ **Day 10**: 流式 SSR 完成 (Node.js + Edge Runtime)
- ✅ **Day 11**: 数据获取集成 `use()` Hook (Phase 4 完成)
- ✅ **Day 12**: HMR + React Fast Refresh 完成 (Phase 5 完成)
- ⏭️ **Phase 6 已跳过**: 中间件系统（Koa 原生中间件已足够）
- ✅ **Phase 7 完成** (2025-11-02): 错误处理 + DevTools (All 3 days completed)
  - ✅ 404/500 错误页面 + 全局错误处理中间件
  - ✅ Error Overlay + ErrorBoundary + 错误报告接口
  - ✅ DevTools 面板 (性能指标 + HMR 状态 + 错误计数)
- **Day 27**: 生产可用 (CLI + 错误处理) ← **下一步**
- **Day 29**: 基础性能优化与文档
- **Day 31**: SEO 优化完成（可选）
- **Day 34**: PPR 极致性能优化 (TTFB < 50ms)
- **Day 37**: 国际化支持，可发布

## Key Design Decisions

### File-System Routing

Pages are automatically converted to routes:

```
pages/index.tsx           → /
pages/about.tsx           → /about
pages/blog/[id].tsx       → /blog/:id

```

Route scanning happens at build time via `src/build/route-scanner.ts` and generates `.routes.json`.

**Page Component Loading**: The framework uses a dual-mode loading system with automatic mapping generation via Webpack plugin. See [Page Loader Architecture](./docs/PAGE_LOADER.md) for details on:
- Automatic component mapping generation (zero manual maintenance)
- Development mode: Dynamic `require()` with HMR support
- Production mode: Static mapping with zero file I/O (<0.1ms)

### React Router v6 Integration (Phase 2.5)

The framework uses **React Router v6** for routing matching and navigation, while preserving file-system routing and streaming capabilities:

**Architecture**:
- **File-system scanner** → Generates `RouteObject[]` for React Router
- **Server-side**: `createStaticHandler` + `createStaticRouter` + `StaticRouterProvider`
- **Client-side**: `createBrowserRouter` + `RouterProvider`
- **Data fetching**: `use()` Hook + Suspense (NOT React Router loaders)

**Server-side rendering**:
```typescript
// src/runtime/server/render.tsx
import { createStaticHandler, createStaticRouter } from 'react-router-dom/server'

const routes = loadRoutes()  // from .routes.json
const { query } = createStaticHandler(routes)
const context = await query(new Request(url))
const router = createStaticRouter(routes, context)

// Streaming SSR compatible
return renderToPipeableStream(
  <StaticRouterProvider router={router} context={context} />
)
```

**Client-side hydration**:
```typescript
// src/runtime/client/entry.tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

const router = createBrowserRouter(window.__ROUTES__)
hydrateRoot(document.getElementById('root'), <RouterProvider router={router} />)
```

**Page components**:
```typescript
// examples/basic/pages/blog/[id].tsx
import { useParams } from 'react-router-dom'

export default function BlogPost() {
  const params = useParams()  // React Router hook
  return <BlogContent id={params.id} />
}
```

**Why React Router v6 (not v7)**:
- v6: Stable, Webpack-friendly, 3+ years production validation
- v7: Primarily optimized for Vite (not Webpack), newer with fewer resources

**What we DON'T use**:
- ❌ React Router `loader` functions (they block streaming)
- ❌ React Router `action` functions
- ✅ We use `use()` Hook + Suspense for data fetching instead

### Data Fetching Strategy

Uses React 19's `use()` Hook with Suspense:

```typescript
// Server-side: await promise
// Client-side: reuse from window.__INITIAL_DATA__
function BlogPost({ params }) {
  return (
    <Suspense fallback={<Skeleton />}>
      <BlogContent id={params.id} />
    </Suspense>
  )
}

function BlogContent({ id }) {
  const data = use(fetchBlog(id))
  return <article>{data.content}</article>
}
```

### TypeScript Configuration

The project uses **5 separate tsconfig files**:

1. `tsconfig.json` - Root config (strict mode, paths)
2. `tsconfig.server.json` - Server-side (CommonJS)
3. `tsconfig.client.json` - Client-side (ESM)
4. `tsconfig.build.json` - Build tools
5. `examples/basic/tsconfig.json` - User projects

All configs extend the root and customize `module`, `lib`, and `types` fields.

### Middleware System

**Note**: Phase 6 (Middleware System) 已跳过。框架使用 Koa 原生中间件系统，无需额外封装。

用户可以在 `src/cli/server.ts` 中直接使用 Koa 中间件：

```typescript
// src/cli/server.ts
app.use(async (ctx, next) => {
  console.log(ctx.url)
  await next()
})
```

### Partial Pre-rendering (PPR) Configuration (Phase 10.5)

PPR can be configured at three levels:

**1. Global Configuration (`app.config.ts`)**:
```typescript
export default {
  server: {
    ppr: {
      enabled: true,
      defaultStrategy: 'auto', // 'static' | 'dynamic' | 'hybrid' | 'auto'
      timeout: 5000,
      cache: {
        type: 'redis', // 'memory' | 'redis' | 'filesystem'
        ttl: 3600,
      }
    }
  }
}
```

**2. Route-Level Configuration**:
```typescript
// pages/blog/[id].tsx
export const config = {
  ppr: {
    enabled: true,
    strategy: 'hybrid',
    timeout: 3000,
    cache: { enabled: true, ttl: 3600 }
  }
}
```

**3. Build-Time Detection**:
The framework automatically analyzes components to detect:
- Suspense boundaries
- Data fetching (use() Hook)
- Optimal rendering strategy (static/dynamic/hybrid)

## Commands

### Basic Commands

```bash
# Development (starts dual HMR + SSR servers) - Phase 5+
pnpm dev

# Type checking
pnpm type-check

# Production build
pnpm build

# Production server (with streaming SSR enabled by default)
pnpm start
```

### Streaming SSR Configuration (Phase 3+)

The framework uses **streaming SSR by default** for optimal performance:

```bash
# Default: Streaming SSR enabled (Node.js renderToPipeableStream)
pnpm start

# Force specific runtime
SSR_RUNTIME=node pnpm start    # Use Node.js renderToPipeableStream (default)
SSR_RUNTIME=edge pnpm start    # Use Edge Runtime renderToReadableStream

# Production build with edge runtime
SSR_RUNTIME=edge NODE_ENV=production pnpm start
```

**Environment Variables**:
- `SSR_RUNTIME`: Force runtime detection (`node` | `edge` | `auto` [default])
- `NODE_ENV`: Set to `production` for optimized builds

**Performance**:
- TTFB: ~120ms
- Shell ready: ~115ms
- Complete render: ~184ms

## Implementation Guidelines

### When Adding New Features

1. **Check the phase**: Reference `docs/ROADMAP.md` to ensure the feature belongs to the current phase
2. **Follow the architecture**: Maintain separation between `runtime/`, `build/`, and `cli/`
3. **TypeScript first**: All code must be strictly typed
4. **Dual runtime support**: Consider both Node.js and Edge runtime when implementing server features

### When Working with Streaming SSR

- Use the unified `StreamResult` interface from `src/runtime/server/streaming/adapter.ts`
- Never directly call `renderToPipeableStream` or `renderToReadableStream` - always use the adapter
- Test both runtime modes: `runtime: 'node'` and `runtime: 'edge'`

### When Working with HMR (Phase 5+)

- **Never** mix HMR server and SSR server responsibilities
- HMR client must connect to `http://localhost:3001/__webpack_hmr`
- Use `module.hot.accept()` only once in client entry point
- Clear `require.cache` for server-side modules in SSR server
- See `docs/HMR.md` for troubleshooting common issues

### When Working with PPR (Phase 10.5+)

- **Never** directly call `prerender()` or `resume()` - always use the unified interfaces in `src/runtime/server/streaming/`
- **Always** handle `postponed` state serialization carefully - it must be JSON-serializable
- **Cache strategy**: Use Redis for production, filesystem for development, memory for testing
- **Timeout handling**: Set appropriate timeouts for prerender (default 5s) and fallback to streaming SSR on timeout
- **Test both modes**:
  - SSR mode: `resume()` for dynamic streaming
  - SSG mode: `resumeAndPrerender()` for build-time static generation
- **Route configuration**: Define `export const config` in page components to control PPR behavior per route
- **Performance monitoring**: Track TTFB, FCP, and LCP metrics to validate PPR improvements

### File Naming Conventions

- **Page components**: `pages/ComponentName.tsx` or `pages/[param].tsx`
  - Automatically loaded via [Page Loader](./docs/PAGE_LOADER.md) system
  - No manual registration required
- **Build scripts**: `src/build/feature-name.ts`
- **Runtime modules**: `src/runtime/{server|client|shared}/module-name.tsx`

### Type Definitions

All framework types are in `types/framework.d.ts`:

**Core Types (Phase 0+)**:
- `RequestContext` - Unified request context (security, trace, abortController, responseMode)
- `SecurityContext` - Security utilities (nonce, sanitizeJSON)
- `TraceContext` - Observability context (requestId, startTime, marks)

**Routing & Data (Phase 1-5)**:
- `Route` - Route configuration
- `Loader` - Data fetching function
- `Middleware` - Request middleware
- `PageComponent` - Page component with loader
- `ApiHandler` - API route handler
- `StreamRenderOptions` - Streaming options

**Configuration (Phase 0+)**:
- `AppConfig` - Application configuration
- `SecurityConfig` - Security settings (CSP, nonce)
- `ObservabilityConfig` - Observability settings (Server-Timing, request ID)

**PPR Types (Phase 10.5)**:
- `PPRConfig` - Partial Pre-rendering configuration
- `PostponedState` - Postponed state object
- `PrerenderResult` - Prerender result interface
- `PPRCache` - Cache interface for postponed states

## Future: React Server Components (RSC)

The architecture is designed to support RSC upgrade (Phase 12+):

- Component marking: `'use client'` / `'use server'`
- Serialization protocol: React Flight Wire Format
- Build separation: Server Components Bundle vs Client Bundle
- Minimal migration cost from current `use()` Hook approach

## Performance Targets

### Traditional SSR (Phase 1-9)
| Metric | Target | Description |
|--------|--------|-------------|
| TTFB | < 200ms | Time to First Byte |
| FCP | < 1s | First Contentful Paint |
| LCP | < 2.5s | Largest Contentful Paint |
| TTI | < 3s | Time to Interactive |
| Hydration | < 500ms | Hydration completion time |

### With PPR Enabled (Phase 10.5+)
| Metric | Target | Description |
|--------|--------|-------------|
| **TTFB** | **< 50ms** | Static shell from cache/CDN |
| **FCP** | **< 400ms** | Instant visible content |
| **LCP** | **< 1s** | Core content fully loaded |
| **TTI** | **< 1.5s** | Interactive significantly faster |
| Hydration | < 300ms | Selective hydration |

## Browser & Runtime Support

- Chrome/Edge ≥ 90
- Firefox ≥ 88
- Safari ≥ 14
- Node.js ≥ 18
- Edge runtimes: Vercel Edge, Cloudflare Workers, Deno Deploy
