/**
 * Page Loader - 双模式组件加载系统
 *
 * 提供自动页面组件加载，支持两种模式：
 * - 生产环境：静态映射（由 Webpack 插件生成，<0.1ms）
 * - 开发环境：动态 require() 支持 HMR（~10ms）
 *
 * @see docs/PAGE_LOADER.md 架构详情
 */

import * as path from 'path'

// =============================================
// 条件导入：只在生产环境导入生成的映射
// =============================================
let pageComponents: Record<string, any> = {}
let availableComponents: string[] = []
let routeToFilePath: Record<string, string> = {}
let getFilePathByRouteFromMapping: (routePath: string) => string | null = () => null

if (process.env.NODE_ENV === 'production') {
  // 只在生产环境导入（该文件由 PageComponentsGeneratorPlugin 创建）
  const generated = require('./page-loader.generated')
  pageComponents = generated.pageComponents
  availableComponents = generated.availableComponents
  routeToFilePath = generated.routeToFilePath
  getFilePathByRouteFromMapping = generated.getFilePathByRoute
}

/**
 * 开发模式组件缓存
 * 存储已加载的组件及其调试元数据
 */
interface DevCacheEntry {
  component: any
  loadedAt: number
  reloadCount: number
}

const devComponentCache = new Map<string, DevCacheEntry>()

/**
 * 性能统计（开发模式）
 */
const performanceStats = {
  totalLoads: 0,
  totalCacheClears: 0,
  totalFilesClearedFromCache: 0,
  totalCacheClearDuration: 0,
  averageCacheClearDuration: 0,
}

/**
 * 缓存清理统计（用于性能监控）
 */
interface CacheClearStats {
  filesCleared: number
  depth: number
  duration: number
}

/**
 * 智能清理 require 缓存
 *
 * 清理指定文件及其直接依赖（可配置深度），避免清理整个目录以提高性能
 *
 * @param filePath - 要清理的文件路径
 * @param maxDepth - 最大清理深度（默认1，即当前文件+直接依赖）
 * @returns 清理统计信息
 *
 * @example
 * ```typescript
 * // 只清理当前文件
 * clearRequireCache('/path/to/component.tsx', 0)
 *
 * // 清理当前文件 + 直接依赖（推荐）
 * clearRequireCache('/path/to/component.tsx', 1)
 * ```
 */
function clearRequireCache(filePath: string, maxDepth: number = 1): CacheClearStats {
  const startTime = Date.now()
  const visited = new Set<string>()
  let filesCleared = 0

  function clearRecursive(modulePath: string, currentDepth: number) {
    // 深度限制或已访问
    if (currentDepth > maxDepth || visited.has(modulePath)) {
      return
    }

    visited.add(modulePath)

    // 获取模块及其依赖
    const module = require.cache[modulePath]

    if (module?.children && currentDepth < maxDepth) {
      // 递归清理子模块（依赖）
      module.children.forEach((child) => {
        // 只清理项目内的模块，跳过 node_modules
        if (!child.id.includes('node_modules')) {
          clearRecursive(child.id, currentDepth + 1)
        }
      })
    }

    // 删除当前模块
    if (require.cache[modulePath]) {
      delete require.cache[modulePath]
      filesCleared++
    }
  }

  try {
    const resolvedPath = require.resolve(filePath)
    clearRecursive(resolvedPath, 0)
  } catch (error) {
    // 文件无法解析，可能不存在
    // 静默失败，调用者会处理
  }

  return {
    filesCleared,
    depth: maxDepth,
    duration: Date.now() - startTime,
  }
}

/**
 * 根据文件路径获取页面组件
 *
 * 双模式加载：
 * - 生产环境：使用预生成的静态映射（极快，<0.1ms）
 * - 开发环境：使用动态 require() 并清除缓存（支持 HMR，~10ms）
 *
 * @param filePath - 页面文件路径（例如：'blog/[id].tsx'）
 * @param pagesDir - pages 目录的绝对路径（仅在开发环境必需）
 * @returns React 组件（default export）
 * @throws 组件未找到时抛出错误
 *
 * @example
 * ```typescript
 * // 生产环境
 * const Component = getPageComponent('index.tsx')
 *
 * // 开发环境
 * const Component = getPageComponent('index.tsx', '/path/to/pages')
 * ```
 */
export function getPageComponent(filePath: string, pagesDir?: string): any {
  // =============================================
  // 生产模式：静态映射
  // =============================================
  if (process.env.NODE_ENV === 'production') {
    const component = pageComponents[filePath]

    if (!component) {
      throw new Error(
        `❌ 页面组件未找到：${filePath}\n` +
          `\n` +
          `可用组件：\n` +
          availableComponents.map((c) => `  - ${c}`).join('\n') +
          `\n\n` +
          `提示：检查路由是否存在于 .routes.json 中\n` +
          `      并使用 'pnpm build' 重新构建项目`
      )
    }

    return component
  }

  // =============================================
  // 开发模式：动态加载（HMR）
  // =============================================
  if (!pagesDir) {
    throw new Error(
      `❌ 开发模式下需要提供 pagesDir 参数\n` +
        `\n` +
        `请将 pages 目录的绝对路径作为第二个参数传入：\n` +
        `  getPageComponent('index.tsx', path.resolve(__dirname, '../../pages'))`
    )
  }

  // 开发环境：纯动态加载，不依赖生成的映射
  const absolutePath = path.resolve(pagesDir, filePath)

  try {
    // 智能清理 require 缓存（当前文件 + 直接依赖）
    // 这确保组件及其导入的模块变化能被正确反映，同时避免清理整个目录
    const clearStats = clearRequireCache(absolutePath, 1)

    // 更新性能统计
    performanceStats.totalLoads++
    performanceStats.totalCacheClears++
    performanceStats.totalFilesClearedFromCache += clearStats.filesCleared
    performanceStats.totalCacheClearDuration += clearStats.duration
    performanceStats.averageCacheClearDuration =
      performanceStats.totalCacheClearDuration / performanceStats.totalCacheClears

    // 开发模式详细日志（可通过环境变量启用）
    if (process.env.DEBUG_PAGE_LOADER) {
      console.log(
        `🔄 [page-loader] Cleared cache for ${filePath}:\n` +
          `   Files: ${clearStats.filesCleared}, Depth: ${clearStats.depth}, Duration: ${clearStats.duration}ms`
      )
    }

    // 重新加载模块
    const module = require(absolutePath)

    if (!module || !module.default) {
      throw new Error(
        `❌ 页面组件没有 default export：${filePath}\n` +
          `\n` +
          `预期格式：\n` +
          `  export default function MyPage() { ... }\n` +
          `\n` +
          `实际找到：\n` +
          `  ${Object.keys(module).join(', ') || '空模块'}\n` +
          `\n` +
          `文件：${absolutePath}`
      )
    }

    // 更新开发缓存（用于调试和性能分析）
    const existing = devComponentCache.get(filePath)
    devComponentCache.set(filePath, {
      component: module.default,
      loadedAt: Date.now(),
      reloadCount: (existing?.reloadCount || 0) + 1,
    })

    return module.default
  } catch (error) {
    // 增强的错误处理，提供有用的提示信息
    if (error instanceof Error && error.message.includes('Cannot find module')) {
      throw new Error(
        `❌ 页面组件未找到：${filePath}\n` +
          `\n` +
          `搜索路径：\n` +
          `  ${absolutePath}\n` +
          `\n` +
          `提示：\n` +
          `  1. 检查文件是否存在于 pages/ 目录中\n` +
          `  2. 运行 'pnpm dev' 重新生成 .routes.json\n` +
          `  3. 确保文件名与路由配置匹配`
      )
    }

    throw error
  }
}

/**
 * 清除组件缓存（开发模式）
 *
 * 用于测试或需要强制重新加载组件时使用
 *
 * @param filePath - 可选的特定文件路径，仅清除该文件
 * @param clearRequire - 是否同时清除 require 缓存（默认 true）
 */
export function clearComponentCache(filePath?: string, clearRequire: boolean = true): void {
  if (filePath) {
    const deleted = devComponentCache.delete(filePath)

    // 可选：同时清除 require 缓存
    if (clearRequire && deleted) {
      const stats = clearRequireCache(filePath, 1)
      console.log(
        `🗑️  [page-loader] 已清除缓存：${filePath}\n` +
          `   Require cache: ${stats.filesCleared} files in ${stats.duration}ms`
      )
    } else if (deleted) {
      console.log(`🗑️  [page-loader] 已清除组件缓存：${filePath}`)
    }
  } else {
    const count = devComponentCache.size
    devComponentCache.clear()
    console.log(`🗑️  [page-loader] 已清除所有组件缓存（${count} 个条目）`)

    // 注意：不清除所有 require 缓存，因为这会影响整个应用
    // 如果需要完全重启，请重启开发服务器
  }
}

/**
 * 检查页面组件是否存在
 *
 * @param filePath - 页面文件路径
 * @returns 如果组件存在于缓存或映射表中则返回 true
 */
export function hasPageComponent(filePath: string): boolean {
  // 生产环境：检查静态映射
  if (process.env.NODE_ENV === 'production') {
    return !!pageComponents[filePath]
  }

  // 开发环境：检查缓存或尝试 resolve 文件
  if (devComponentCache.has(filePath)) {
    return true
  }

  // 注意：这是一个快速检查，不会真正加载组件
  // 实际存在性应该通过 getPageComponent() 调用来验证
  return false
}

/**
 * 获取组件加载统计信息（调试用）
 *
 * 用于开发模式下的性能分析和调试
 *
 * @returns 加载统计信息
 *
 * @example
 * ```typescript
 * const stats = getLoadStats()
 * console.log(JSON.stringify(stats, null, 2))
 * ```
 */
export function getLoadStats() {
  if (process.env.NODE_ENV === 'production') {
    return {
      mode: 'production',
      componentsCount: availableComponents.length,
      components: availableComponents,
    }
  }

  return {
    mode: 'development',
    loadedCount: devComponentCache.size,
    totalAvailable: availableComponents.length,
    performance: {
      totalLoads: performanceStats.totalLoads,
      totalCacheClears: performanceStats.totalCacheClears,
      totalFilesClearedFromCache: performanceStats.totalFilesClearedFromCache,
      averageCacheClearDuration: Math.round(performanceStats.averageCacheClearDuration * 100) / 100,
      totalCacheClearDuration: performanceStats.totalCacheClearDuration,
    },
    components: Array.from(devComponentCache.entries()).map(([path, info]) => ({
      path,
      loadedAt: new Date(info.loadedAt).toISOString(),
      reloadCount: info.reloadCount,
    })),
  }
}

/**
 * 根据路由路径获取文件路径
 *
 * 反向查找：路由路径 → 文件路径
 *
 * @param routePath - 路由路径（例如：'/blog/:id'）
 * @returns 文件路径（例如：'blog/[id].tsx'）或 null
 *
 * @example
 * ```typescript
 * const filePath = getFilePathByRoute('/blog/:id')
 * // 返回：'blog/[id].tsx'
 *
 * const component = getPageComponent(filePath, pagesDir)
 * ```
 */
export function getFilePathByRoute(routePath: string): string | null {
  return getFilePathByRouteFromMapping(routePath)
}

/**
 * 获取所有可用的组件文件路径
 *
 * @returns 文件路径数组
 */
export function getAllComponents(): string[] {
  return [...availableComponents]
}

/**
 * 获取路由到文件路径的映射
 *
 * @returns 路由路径到文件路径的映射对象
 */
export function getRouteToFileMapping(): Record<string, string> {
  return { ...routeToFilePath }
}
