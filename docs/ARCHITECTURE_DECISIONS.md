# 架构决策记录 (Architecture Decision Records)

> 记录 React 19 SSR 框架的关键架构决策，确保设计一致性和可维护性

---

## ADR-001: 请求上下文统一设计

**日期**: 2025-10-25
**状态**: ✅ 已采纳
**阶段**: Phase 0

### 背景

所有中间件、SSR 渲染、API 处理都需要共享请求级信息（如 nonce、requestId、日志等）。如果后期再添加这些字段，会导致大量重构。

### 决策

在 Phase 0 就定义完整的 `RequestContext` 接口：

```typescript
export interface RequestContext extends Context {
  security: SecurityContext      // 安全层：nonce、sanitizeJSON
  trace: TraceContext            // 追踪层：requestId、startTime、marks
  log: Logger                    // 日志接口
  abortController: AbortController  // 控制层：统一中止信号
  responseMode: 'stream' | 'static' | 'ppr'  // 渲染模式
  route?: RouteContext           // 路由上下文（Phase 2+）
}
```

### 理由

1. **Phase 4 流式渲染强依赖**：
   - `abortController` 用于超时控制
   - `trace.marks` 用于记录 TTFB、shell、allReady 时间

2. **Phase 10.5 PPR 需要**：
   - `responseMode` 决定缓存策略和响应头

3. **避免技术债务**：
   - 所有后续 Phase 都基于这个上下文
   - 后期添加字段成本极高

### 后果

- ✅ 所有中间件使用统一接口
- ✅ 支持分布式追踪（requestId）
- ✅ 支持性能监控（trace.marks）
- ⚠️ Phase 0 需要提前定义所有字段（可接受）

---

## ADR-002: 日志接口前置定义

**日期**: 2025-10-25
**状态**: ✅ 已采纳
**阶段**: Phase 0

### 背景

框架各处都需要打日志，如果不提前定义接口，代码会散落 `console.log()`，后期迁移成本高。

### 决策

**Phase 0 定义接口**：

```typescript
export interface Logger {
  debug(message: string, meta?: Record<string, any>): void
  info(message: string, meta?: Record<string, any>): void
  warn(message: string, meta?: Record<string, any>): void
  error(message: string, meta?: Record<string, any>): void
}
```

**Phase 0-7 实现**：使用 `console` 输出（带 requestId）

```typescript
export class RequestLogger implements Logger {
  info(message: string, meta?: Record<string, any>) {
    console.info(JSON.stringify({
      level: 'info',
      message,
      requestId: this.ctx.trace.id,
      timestamp: new Date().toISOString(),
      ...meta
    }))
  }
}
```

**Phase 8+ 迁移**：切换到 Pino/Winston（只改实现，接口不变）

### 理由

1. **接口稳定性**：
   - 所有代码使用 `ctx.log.info()`
   - 迁移日志库时，只改 `RequestLogger` 实现

2. **分布式追踪**：
   - 所有日志自动带 requestId
   - 支持跨服务日志关联

3. **结构化日志**：
   - Phase 0 就输出 JSON 格式
   - 便于日志收集和分析

### 后果

- ✅ 日志格式统一
- ✅ 自动包含 requestId、timestamp
- ✅ 迁移日志库成本低
- ⚠️ Phase 0 性能略低于直接 console（可接受）

---

## ADR-003: Streaming 协议类型前置定义

**日期**: 2025-10-25
**状态**: ✅ 已采纳
**阶段**: Phase 0（定义）→ Phase 4（实现）

### 背景

流式渲染涉及多个配置项（revealStrategy、shellTimeout、边界 ID 等），如果 Phase 4 才定义，用户无法提前了解配置选项。

### 决策

**Phase 0 定义完整类型**：

```typescript
export interface StreamRenderOptions {
  runtime?: 'node' | 'edge' | 'auto'

  streaming?: {
    revealStrategy?: 'batched' | 'progressive'  // 揭示策略
    shellTimeout?: number                       // 外壳超时（ms）
    boundaryPrefix?: string                     // 边界 ID 前缀
  }

  onShellReady?: () => void
  onAllReady?: () => void
  onError?: (error: Error) => void
}

export interface SuspenseBoundary {
  id: string         // 格式: B:${route}:${index}
  fallback: string
  priority?: number
}
```

**Phase 4 实现**：按照类型定义实现流式渲染

### 理由

1. **配置可见性**：
   - 用户能在 `app.config.ts` 中看到所有选项
   - IDE 自动补全提示完整配置

2. **接口稳定性**：
   - Phase 4 实现时不需要改类型
   - 避免配置项频繁变更

3. **安全设计**：
   - 边界 ID 命名规则提前确定（`B:${route}:${index}`）
   - 替换脚本强制使用 nonce

### 后果

- ✅ 用户能提前了解所有配置
- ✅ Phase 4 实现时接口稳定
- ✅ 边界 ID 命名规则统一
- ⚠️ Phase 0 定义的选项可能未完全实现（文档需注明）

---

## ADR-004: 路由依赖映射前置规划

**日期**: 2025-10-25
**状态**: ✅ 已采纳
**阶段**: Phase 1（HTML 预留）→ Phase 2（实现）

### 背景

预加载优化需要知道每个路由依赖哪些 JS/CSS 文件，如果 Phase 1 HTML 模板没预留注入位置，Phase 2-4 要大改模板。

### 决策

**Phase 0 定义类型**：

```typescript
export interface RouteDeps {
  js?: string[]       // JavaScript 文件
  css?: string[]      // CSS 文件
  preload?: string[]  // 预加载资源
  prefetch?: string[] // 预获取资源
}
```

**Phase 1 HTML 模板预留位置**：

```html
<head>
  <!-- Phase 1 预留，Phase 2 实现 -->
  ${generatePreloadTags(deps, nonce)}

  <!-- Phase 4 实现防 FOUC -->
  ${generateCriticalCSS(route, nonce)}
</head>
```

**Phase 2 产出 routeDeps.json**：

```json
{
  "/blog/[id]": {
    "js": ["/runtime.abc.js", "/blog.def.js"],
    "css": ["/blog.xyz.css"],
    "preload": ["/api-client.js"]
  }
}
```

### 理由

1. **避免 HTML 重构**：
   - Phase 1 模板就预留注入位置
   - Phase 2-4 只需实现生成函数

2. **性能优化基础**：
   - 支持模块预加载（`<link rel="modulepreload">`）
   - 支持样式预加载（`<link rel="preload" as="style">`）

3. **防止 FOUC**：
   - 关键 CSS 内联为 `<style data-precedence="high">`
   - 使用 React 19 的 hoistable 样式

### 后果

- ✅ Phase 1 HTML 模板一次到位
- ✅ 支持增量实现预加载优化
- ✅ 防止样式闪烁（FOUC）
- ⚠️ Phase 1 模板有未使用的占位符（可接受）

---

## ADR-005: 响应头统一管理

**日期**: 2025-10-25
**状态**: ✅ 已采纳
**阶段**: Phase 0

### 背景

响应头散落在代码各处（CSP、Server-Timing、Cache-Control 等），难以维护和测试。

### 决策

**创建 `ResponseHeaders` 类**，作为所有响应头的唯一出口：

```typescript
export class ResponseHeaders {
  constructor(private ctx: RequestContext) {}

  setCSP() { /* 基于 ctx.security.nonce */ }
  setServerTiming() { /* 基于 ctx.trace.marks */ }
  setCacheControl() { /* 基于 ctx.responseMode */ }
  setETag(content: string) { /* MD5 hash */ }
  setRequestId() { /* ctx.trace.id */ }

  applyAll() {
    this.setCSP()
    this.setServerTiming()
    this.setCacheControl()
    this.setRequestId()
  }
}
```

**使用模式**：

```typescript
export async function renderPage(ctx: RequestContext) {
  const html = await streamRender(ctx)

  const headers = new ResponseHeaders(ctx)
  headers.applyAll()  // 统一应用所有响应头

  return html
}
```

### 理由

1. **集中管理**：
   - 所有响应头逻辑在一个类中
   - 避免代码中散落的 `setHeader()` 调用

2. **一致性**：
   - CSP 自动使用请求级 nonce
   - Cache-Control 自动根据 responseMode 配置

3. **可测试性**：
   - 容易测试响应头设置逻辑
   - 容易 mock 和验证

### 后果

- ✅ 响应头逻辑集中
- ✅ 自动保证一致性
- ✅ 易于测试和维护
- ⚠️ 增加一层抽象（可接受）

---

## ADR-006: 安全优先设计

**日期**: 2025-10-25
**状态**: ✅ 已采纳
**阶段**: Phase 0

### 背景

XSS 攻击是 SSR 框架的主要安全风险，必须从架构层面防御。

### 决策

**1. 强制使用 CSP nonce**：

```typescript
// ❌ 禁止直接写 <script>
const html = `<script>window.__DATA__ = ${JSON.stringify(data)}</script>`

// ✅ 必须使用 injectScript()
const html = injectScript(
  `window.__DATA__ = ${ctx.security.sanitizeJSON(data)}`,
  { nonce: ctx.security.nonce }
)
```

**2. JSON 序列化转义**：

```typescript
export function sanitizeJSON(data: any): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')      // 防止 </script>
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
}
```

**3. 请求级 nonce**：

```typescript
export function generateNonce(): string {
  return crypto.randomBytes(16).toString('base64')  // 每次请求不同
}
```

### 理由

1. **符合现代安全标准**：
   - Google、Meta 都强制要求 CSP nonce
   - 符合 CSP Level 3 规范

2. **从源头防御 XSS**：
   - 攻击者无法注入无 nonce 的脚本
   - `sanitizeJSON()` 防止 `</script>` 注入

3. **安全审计友好**：
   - 所有脚本都有 nonce
   - 容易通过自动化扫描

### 后果

- ✅ 符合现代安全标准
- ✅ 从源头防御 XSS
- ✅ 通过安全审计
- ⚠️ 必须严格使用 `injectScript()`（通过 ESLint 强制）

---

## 决策总结表

| ADR | 决策内容 | Phase 0 | Phase 1 | Phase 2 | Phase 4 | 影响范围 |
|-----|---------|---------|---------|---------|---------|----------|
| ADR-001 | RequestContext 统一设计 | ✅ 定义 | 使用 | 扩展 | 使用 | 全局 |
| ADR-002 | 日志接口前置定义 | ✅ 定义+实现 | 使用 | 使用 | 使用 | 全局 |
| ADR-003 | Streaming 类型定义 | ✅ 定义 | - | - | 实现 | 流式渲染 |
| ADR-004 | 路由依赖映射 | ✅ 定义类型 | HTML 预留 | 实现分析 | 使用 | 性能优化 |
| ADR-005 | 响应头统一管理 | ✅ 定义+实现 | 使用 | 使用 | 使用 | 全局 |
| ADR-006 | 安全优先设计 | ✅ 定义+实现 | 使用 | 使用 | 使用 | 全局 |

---

## 实施原则

### 1. 接口稳定性优先

**原则**：Phase 0 定义完整接口，后续 Phase 只实现功能，不改接口

**示例**：
- ✅ Phase 0 定义 `StreamRenderOptions` 完整类型
- ✅ Phase 4 实现流式渲染，但不修改类型
- ❌ Phase 4 发现需要新字段时，回退到 Phase 0 修改

### 2. HTML 模板一次到位

**原则**：Phase 1 HTML 模板预留所有注入位置，避免后期重构

**示例**：
```html
<head>
  <!-- Phase 2 实现 -->
  ${generatePreloadTags(deps, nonce)}

  <!-- Phase 4 实现 -->
  ${generateCriticalCSS(route, nonce)}
</head>
```

### 3. 安全强制执行

**原则**：通过架构设计强制安全最佳实践，而非依赖开发者自觉

**示例**：
- ✅ `injectScript()` 强制要求 nonce 参数
- ✅ `sanitizeJSON()` 自动转义危险字符
- ❌ 文档提醒开发者"记得添加 nonce"

### 4. 可观测性内置

**原则**：日志、追踪、性能监控应该是框架内置能力，而非可选插件

**示例**：
- ✅ 所有请求自动生成 requestId
- ✅ 所有日志自动包含 requestId
- ✅ 所有响应自动包含 X-Request-ID

---

## 参考文档

- [CSP Level 3 Specification](https://www.w3.org/TR/CSP3/)
- [Server-Timing Header](https://www.w3.org/TR/server-timing/)
- [React 19 Streaming SSR](https://react.dev/reference/react-dom/server/renderToPipeableStream)
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)

---

**最后更新**: 2025-10-25
**维护者**: Claude Code
