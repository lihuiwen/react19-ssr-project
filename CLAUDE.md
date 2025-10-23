# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important: Documentation Synchronization

**⚠️ When updating project status or completing phases:**

1. **ROADMAP.md is the source of truth** for implementation details and phase status
2. **CLAUDE.md must be kept in sync** with ROADMAP.md milestones
3. **Update both files** when:
   - Completing a phase (mark with ✅ in ROADMAP.md)
   - Changing the current phase status
   - Adding new milestones or adjusting timelines
4. **Key sections to sync**:
   - "Current Phase" indicator
   - "Key Milestones" completion status
   - Any architectural changes from implementation learnings

## Project Overview

This is a **React 19.2 SSR (Server-Side Rendering) Framework** built from scratch with streaming SSR capabilities and edge runtime compatibility. The project follows a phased development approach detailed in `ROADMAP.md`.

### Core Technology Stack

- **Build Tool**: Webpack 5
- **Server Framework**: Koa
- **Routing**: File-system based routing + API routes
- **Styling**: Tailwind CSS
- **Data Fetching**: React 19 `use()` Hook
- **Streaming**: `renderToPipeableStream` (Node.js) and `renderToReadableStream` (Edge Runtime)
- **Language**: TypeScript (strict mode)

### Project Status

This is a **greenfield project** currently in the planning and initial setup phase. Reference `ROADMAP.md` for the complete 11-phase implementation plan (Phase 0-11, ~40 days).

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
│   ├── route-scanner.ts
│   └── api-scanner.ts
└── cli/              # Command-line interface (dev, build, start)

examples/basic/       # Example application
└── pages/            # File-system routing directory
    ├── *.tsx         # Page components
    └── api/          # API route handlers

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

### HMR Architecture (Phase 6)

The framework uses a **dual-server architecture** for Hot Module Replacement:

- **HMR Server (Port 3001)**: Express-based Webpack dev server
  - Compiles client code
  - Pushes updates via SSE (Server-Sent Events)
  - Serves `bundle.js` and hot-update files

- **SSR Server (Port 3000)**: Koa-based rendering server
  - Handles server-side rendering
  - Serves static files from `dist/`
  - Uses nodemon for server-side code changes

See `HMR.md` for detailed documentation on the dual-server HMR setup.

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

The implementation follows these key milestones (from `ROADMAP.md`):

### Phase Overview

| Phase | Days | Milestone |
|-------|------|-----------|
| 0 | 1-2 | Project initialization + TypeScript setup |
| 1 | 3-5 | Basic SSR (renderToString) |
| 2 | 6-8 | File-system routing |
| 3 | 9-10 | API routes |
| 4 | 11-14 | **Streaming SSR** (core feature) |
| 5 | 15-17 | Data fetching with `use()` Hook |
| 6 | 18-22 | HMR + React Fast Refresh |
| 7 | 23-24 | Middleware system |
| 8 | 25-27 | Error handling + DevTools |
| 9 | 28-30 | CLI tools |
| 10 | 31-32 | Basic performance optimization + docs |
| 10.5 | 33-35 | **Partial Pre-rendering (PPR)** - React 19.2 |
| 11 | 36-40 | i18n (optional) |

### Key Milestones

- **Day 2**: 项目脚手架完成
- **Day 5**: 基础 SSR 可运行
- **Day 10**: 路由和 API 完整
- **Day 17**: 流式 SSR + 数据获取 **(核心 MVP)**
- **Day 24**: 完整开发体验 (HMR + 中间件)
- **Day 30**: 生产可用 (CLI + 错误处理)
- **Day 32**: 基础性能优化与文档
- **Day 35**: PPR 极致性能优化 (TTFB < 50ms)
- **Day 40**: 国际化支持，可发布

**Current Phase**: Phase 0 - Project initialization

## Key Design Decisions

### File-System Routing

Pages are automatically converted to routes:

```
pages/index.tsx           → /
pages/about.tsx           → /about
pages/blog/[id].tsx       → /blog/:id
pages/api/hello.ts        → /api/hello
```

Route scanning happens at build time via `src/build/route-scanner.ts` and generates `.routes.json`.

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

### Middleware System (Phase 7)

Middleware can be defined in `middleware.ts`:

```typescript
export const middleware: Middleware[] = [
  // Simple middleware
  async (ctx, next) => {
    console.log(ctx.url)
    await next()
  },

  // With matcher
  {
    matcher: /^\/admin/,
    handler: async (ctx, next) => { /* ... */ }
  }
]
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

Currently, the project is in Phase 0 (initialization). Once implemented, the following commands will be available:

```bash
# Development (starts dual HMR + SSR servers)
pnpm dev

# Type checking
pnpm type-check

# Production build
pnpm build

# Production server
pnpm start
```

## Implementation Guidelines

### When Adding New Features

1. **Check the phase**: Reference `ROADMAP.md` to ensure the feature belongs to the current phase
2. **Follow the architecture**: Maintain separation between `runtime/`, `build/`, and `cli/`
3. **TypeScript first**: All code must be strictly typed
4. **Dual runtime support**: Consider both Node.js and Edge runtime when implementing server features

### When Working with Streaming SSR

- Use the unified `StreamResult` interface from `src/runtime/server/streaming/adapter.ts`
- Never directly call `renderToPipeableStream` or `renderToReadableStream` - always use the adapter
- Test both runtime modes: `runtime: 'node'` and `runtime: 'edge'`

### When Working with HMR (Phase 6+)

- **Never** mix HMR server and SSR server responsibilities
- HMR client must connect to `http://localhost:3001/__webpack_hmr`
- Use `module.hot.accept()` only once in client entry point
- Clear `require.cache` for server-side modules in SSR server
- See `HMR.md` for troubleshooting common issues

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
- **API routes**: `pages/api/routeName.ts`
- **Build scripts**: `src/build/feature-name.ts`
- **Runtime modules**: `src/runtime/{server|client|shared}/module-name.tsx`

### Type Definitions

All framework types are in `types/framework.d.ts`:

- `Route` - Route configuration
- `Loader` - Data fetching function
- `Middleware` - Request middleware
- `PageComponent` - Page component with loader
- `ApiHandler` - API route handler
- `StreamRenderOptions` - Streaming options
- `AppConfig` - Application configuration
- `PPRConfig` - Partial Pre-rendering configuration (Phase 10.5)
- `PostponedState` - Postponed state object (Phase 10.5)
- `PrerenderResult` - Prerender result interface (Phase 10.5)
- `PPRCache` - Cache interface for postponed states (Phase 10.5)

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
