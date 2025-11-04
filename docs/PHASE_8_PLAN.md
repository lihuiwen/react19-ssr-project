# Phase 8: CLI 工具 - 实施计划（修订版）

> React 19 SSR Framework - CLI 工具开发计划
>
> **预计时间**: 2天 MVP + 1天可选增强
> **实施日期**: 2025-11-03 开始
> **当前状态**: 📋 规划中（已修订）
> **修订日期**: 2025-11-03
>
> ⚠️ **重要**: 本文档已根据技术审查更新，修复了 ESM/CommonJS 冲突等关键问题

## 📋 目录

- [1. 概述](#1-概述)
- [2. 当前状态](#2-当前状态)
- [3. 实施策略](#3-实施策略)
- [4. 详细任务](#4-详细任务)
- [5. 技术选型](#5-技术选型)
- [6. 文件结构](#6-文件结构)
- [7. 实施时间表](#7-实施时间表)
- [8. 验收标准](#8-验收标准)

---

## 1. 概述

### 1.1 目标

实现完善的 CLI 工具系统，提供友好的命令行体验：
- ✅ 标准化命令（dev, build, start, create）
- ✅ 配置文件系统（app.config.ts）
- ✅ 美观的终端输出
- ✅ 友好的错误提示
- ✅ 完善的帮助文档

### 1.2 价值

- **用户体验提升**: 类似 Next.js/Vite 的 CLI 体验
- **降低使用门槛**: 清晰的命令和提示
- **提高开发效率**: 快速创建和配置项目
- **专业化**: 完整的框架必备组件

---

## 2. 当前状态

### 2.1 已有文件

```
src/cli/
├── build.ts      # 生产构建脚本 (基础实现)
├── dev.ts        # 开发服务器启动 (基础实现)
├── server.ts     # Koa 服务器配置 (完整实现)
└── start.ts      # 生产服务器启动 (基础实现)
```

### 2.2 已有 package.json 脚本

```json
{
  "scripts": {
    "dev": "tsx src/cli/dev.ts",
    "build": "NODE_ENV=production tsx src/cli/build.ts",
    "start": "NODE_ENV=production node dist/server/server.js",
    "type-check": "tsc --noEmit"
  }
}
```

### 2.3 缺失功能

**Phase 8 MVP (必须)**:
- ❌ 命令行参数解析（commander）
- ❌ 彩色日志系统（chalk + ora）
- ❌ 统一的错误处理
- ❌ 帮助文档系统
- ❌ 版本信息显示

**Phase 8.5+ (可选增强)**:
- ⏳ `create` 命令（项目脚手架）- 推迟到 Phase 9
- ⏳ 配置文件系统（app.config.ts）- 可选功能

---

## 3. 实施策略

### 3.1 MVP 优先策略（已修订）

**原则**: 先实现核心功能，后续逐步增强

```
Phase 8 MVP (2天 - 优先级高)
├─ Day 1: 基础设施
│   ├─ CLI 框架搭建 (commander)
│   ├─ 日志系统 (chalk v4 + ora v5)
│   ├─ 错误处理系统
│   └─ 工具函数 (port checker)
│
└─ Day 2: 命令增强
    ├─ 改造 dev 命令 (参数 + 日志)
    ├─ 改造 build 命令 (进度 + 统计)
    ├─ 改造 start 命令 (检查 + 提示)
    └─ 帮助文档完善

Phase 8.5+ (可选增强 - 推迟)
├─ 配置文件系统 (app.config.ts)
├─ create 命令 (项目脚手架)
└─ 终端美化增强 (Logo + 进度条)
```

### 3.2 关键修复

**修复 1: ESM/CommonJS 兼容性** 🔴
- ❌ 原计划: chalk@5, ora@8 (ESM-only)
- ✅ 修订: chalk@4, ora@5 (CommonJS 兼容)
- **原因**: 项目是 `"type": "commonjs"`，不能使用 ESM-only 包

**修复 2: 简化 MVP 范围** 🟡
- ❌ 原计划: 包含 create 命令和配置文件
- ✅ 修订: 先实现核心命令，create 推迟到 Phase 9
- **原因**: 降低复杂度，更快交付核心价值

**修复 3: 添加缺失函数** 🟡
- ❌ 原计划: 使用 `checkPort()` 但未实现
- ✅ 修订: 添加完整的端口检查工具
- **原因**: 确保代码可运行

### 3.2 兼容性保证

- ✅ 保持 `pnpm dev/build/start` 现有行为
- ✅ 新增可选参数，不影响默认行为
- ✅ 配置文件可选，提供合理默认值

---

## 4. 详细任务

### Day 1: 基础设施 (2025-11-03)

#### 任务 1.1: CLI 框架搭建 (2h)

**目标**: 引入 commander.js，实现命令框架

**文件**:
```
src/cli/
├── index.ts              # CLI 入口
├── commands/             # 命令实现
│   ├── dev.ts
│   ├── build.ts
│   ├── start.ts
│   └── create.ts
└── utils/                # 工具函数
    ├── logger.ts         # 日志系统
    ├── config.ts         # 配置加载
    └── error.ts          # 错误处理
```

**技术选型**:
- `commander`: CLI 框架（Next.js 同款）
- `chalk`: 彩色输出（最流行）
- `ora`: Spinner 动画（优雅的加载提示）

**实现**:
```typescript
// src/cli/index.ts
import { Command } from 'commander'
import { version } from '../../package.json'

const program = new Command()

program
  .name('react19-ssr')
  .description('React 19 SSR Framework CLI')
  .version(version)

// 注册命令
program
  .command('dev')
  .description('Start development server')
  .option('-p, --port <port>', 'Port number', '3000')
  .option('-H, --host <host>', 'Host name', 'localhost')
  .action(devCommand)

program
  .command('build')
  .description('Build for production')
  .option('--analyze', 'Analyze bundle size')
  .action(buildCommand)

program
  .command('start')
  .description('Start production server')
  .option('-p, --port <port>', 'Port number', '3000')
  .action(startCommand)

program
  .command('create <project-name>')
  .description('Create a new project')
  .option('-t, --template <template>', 'Template name', 'basic')
  .action(createCommand)

program.parse()
```

#### 任务 1.2: 日志系统 (1.5h)

**目标**: 实现彩色日志和 Spinner 动画

**文件**: `src/cli/utils/logger.ts`

**实现**:
```typescript
import chalk from 'chalk'
import ora, { Ora } from 'ora'

export class Logger {
  private spinner: Ora | null = null

  // 信息日志
  info(message: string) {
    console.log(chalk.blue('ℹ'), message)
  }

  // 成功日志
  success(message: string) {
    console.log(chalk.green('✓'), message)
  }

  // 警告日志
  warn(message: string) {
    console.log(chalk.yellow('⚠'), message)
  }

  // 错误日志
  error(message: string, error?: Error) {
    console.log(chalk.red('✖'), message)
    if (error && error.stack) {
      console.log(chalk.gray(error.stack))
    }
  }

  // 启动 Spinner
  startSpinner(message: string): Ora {
    this.spinner = ora(message).start()
    return this.spinner
  }

  // 成功停止 Spinner
  succeedSpinner(message: string) {
    if (this.spinner) {
      this.spinner.succeed(message)
      this.spinner = null
    }
  }

  // 失败停止 Spinner
  failSpinner(message: string) {
    if (this.spinner) {
      this.spinner.fail(message)
      this.spinner = null
    }
  }

  // 打印分隔线
  divider() {
    console.log(chalk.gray('─'.repeat(60)))
  }

  // 打印 Banner
  banner(text: string) {
    console.log()
    console.log(chalk.bold.cyan('  ' + text))
    this.divider()
  }
}

export const logger = new Logger()
```

#### 任务 1.3: 配置文件系统 (1.5h)

**目标**: 支持 `app.config.ts` 配置文件

**文件**: `src/cli/utils/config.ts`

**实现**:
```typescript
import path from 'path'
import fs from 'fs'

export interface AppConfig {
  // 服务器配置
  server?: {
    port?: number
    host?: string
    staticDir?: string
  }

  // 路由配置
  routes?: {
    pagesDir?: string
    routesFile?: string
  }

  // 构建配置
  build?: {
    outDir?: string
    analyze?: boolean
    sourcemap?: boolean
  }

  // Webpack 扩展
  webpack?: {
    client?: (config: any) => any
    server?: (config: any) => any
  }
}

const DEFAULT_CONFIG: AppConfig = {
  server: {
    port: 3000,
    host: 'localhost',
    staticDir: 'dist/client',
  },
  routes: {
    pagesDir: 'examples/basic/pages',
    routesFile: 'dist/.routes.json',
  },
  build: {
    outDir: 'dist',
    analyze: false,
    sourcemap: true,
  },
}

export async function loadConfig(cwd: string = process.cwd()): Promise<AppConfig> {
  const configPath = path.resolve(cwd, 'app.config.ts')

  // 如果配置文件不存在，使用默认配置
  if (!fs.existsSync(configPath)) {
    return DEFAULT_CONFIG
  }

  try {
    // 动态导入 TypeScript 配置文件
    const { register } = await import('tsx/esm/api')
    const unregister = register()

    const userConfig = await import(configPath)
    unregister()

    // 合并用户配置和默认配置
    return deepMerge(DEFAULT_CONFIG, userConfig.default || userConfig)
  } catch (error) {
    console.error('Failed to load app.config.ts:', error)
    return DEFAULT_CONFIG
  }
}

function deepMerge(target: any, source: any): any {
  const result = { ...target }
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key])
    } else {
      result[key] = source[key]
    }
  }
  return result
}
```

**配置文件示例**:
```typescript
// app.config.ts (项目根目录)
import { AppConfig } from './src/cli/utils/config'

const config: AppConfig = {
  server: {
    port: 4000,
  },
  routes: {
    pagesDir: 'src/pages',
  },
  webpack: {
    client: (config) => {
      // 自定义 Webpack 配置
      return config
    },
  },
}

export default config
```

#### 任务 1.4: 端口检查工具 (0.5h)

**目标**: 实现端口可用性检查

**文件**: `src/cli/utils/port.ts`

**实现**:
```typescript
import net from 'net'

/**
 * 检查端口是否可用
 */
export async function checkPort(port: number, host: string = '0.0.0.0'): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer()

    server.once('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false) // 端口被占用
      } else {
        resolve(false) // 其他错误
      }
    })

    server.once('listening', () => {
      server.close()
      resolve(true) // 端口可用
    })

    server.listen(port, host)
  })
}

/**
 * 查找可用端口（从指定端口开始递增查找）
 */
export async function findAvailablePort(
  startPort: number,
  maxAttempts: number = 10
): Promise<number | null> {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i
    const available = await checkPort(port)
    if (available) {
      return port
    }
  }
  return null
}
```

#### 任务 1.5: 错误处理 (1h)

**目标**: 统一错误处理和友好提示

**文件**: `src/cli/utils/error.ts`

```typescript
import { logger } from './logger'

export class CLIError extends Error {
  constructor(
    message: string,
    public code: string = 'CLI_ERROR',
    public hint?: string
  ) {
    super(message)
    this.name = 'CLIError'
  }
}

export function handleError(error: Error | CLIError) {
  if (error instanceof CLIError) {
    logger.error(error.message)
    if (error.hint) {
      console.log()
      logger.info('💡 Hint: ' + error.hint)
    }
  } else {
    logger.error('Unexpected error occurred')
    if (process.env.DEBUG) {
      console.error(error)
    } else {
      logger.info('Run with DEBUG=* for more details')
    }
  }

  process.exit(1)
}

// 常见错误
export const Errors = {
  PORT_IN_USE: (port: number) =>
    new CLIError(
      `Port ${port} is already in use`,
      'PORT_IN_USE',
      `Try using a different port with --port flag`
    ),

  CONFIG_NOT_FOUND: () =>
    new CLIError(
      'app.config.ts not found',
      'CONFIG_NOT_FOUND',
      'Create app.config.ts in project root or use default config'
    ),

  BUILD_FAILED: (message: string) =>
    new CLIError(
      `Build failed: ${message}`,
      'BUILD_FAILED',
      'Check the error above for details'
    ),
}
```

---

### Day 2: 命令增强 (2025-11-04)

#### 任务 2.1: 改造 `dev` 命令 (2h)

**目标**: 增强开发服务器命令

**文件**: `src/cli/commands/dev.ts`

**功能**:
- ✅ 参数解析（--port, --host, --open）
- ✅ 配置文件加载
- ✅ 美化启动输出
- ✅ 错误处理

```typescript
import { Command } from 'commander'
import { logger } from '../utils/logger'
import { loadConfig } from '../utils/config'
import { handleError, Errors } from '../utils/error'
import { startDevServer } from '../../cli/dev'

export function createDevCommand(program: Command) {
  program
    .command('dev')
    .description('Start development server with HMR')
    .option('-p, --port <port>', 'Port number', '3000')
    .option('-H, --host <host>', 'Host name', 'localhost')
    .option('-o, --open', 'Open browser automatically', false)
    .action(async (options) => {
      try {
        logger.banner('🚀 React 19 SSR Framework')

        // 加载配置
        const spinner = logger.startSpinner('Loading configuration...')
        const config = await loadConfig()
        logger.succeedSpinner('Configuration loaded')

        // 合并配置和命令行参数
        const port = parseInt(options.port || config.server?.port || 3000)
        const host = options.host || config.server?.host || 'localhost'

        // 检查端口是否可用
        const isPortAvailable = await checkPort(port)
        if (!isPortAvailable) {
          throw Errors.PORT_IN_USE(port)
        }

        // 启动开发服务器
        logger.info('Starting development servers...')
        console.log()

        await startDevServer({ port, host, config })

        // 成功启动
        console.log()
        logger.divider()
        logger.success('Development server is ready!')
        console.log()
        logger.info(`  ➜ Local:   http://${host}:${port}`)
        logger.info(`  ➜ Network: http://<your-ip>:${port}`)
        console.log()
        logger.info('Press Ctrl+C to stop')
        logger.divider()

        if (options.open) {
          const open = await import('open')
          await open.default(`http://${host}:${port}`)
        }
      } catch (error) {
        handleError(error as Error)
      }
    })
}
```

#### 任务 2.2: 改造 `build` 命令 (1.5h)

**目标**: 增强生产构建命令

**文件**: `src/cli/commands/build.ts`

**功能**:
- ✅ 进度显示
- ✅ 构建统计
- ✅ Bundle 分析
- ✅ 构建时间显示

```typescript
import { Command } from 'commander'
import { logger } from '../utils/logger'
import { loadConfig } from '../utils/config'
import { handleError } from '../utils/error'
import { build } from '../../cli/build'

export function createBuildCommand(program: Command) {
  program
    .command('build')
    .description('Build for production')
    .option('--analyze', 'Analyze bundle size', false)
    .option('--no-sourcemap', 'Disable source maps')
    .action(async (options) => {
      try {
        const startTime = Date.now()
        logger.banner('📦 Building for production')

        // 加载配置
        const config = await loadConfig()

        // 清理输出目录
        const spinner = logger.startSpinner('Cleaning output directory...')
        await cleanOutputDir(config.build?.outDir || 'dist')
        logger.succeedSpinner('Output directory cleaned')

        // 构建服务端
        logger.info('Building server bundle...')
        await build({ target: 'server', config, sourcemap: options.sourcemap })
        logger.success('Server bundle built successfully')

        // 构建客户端
        logger.info('Building client bundle...')
        await build({ target: 'client', config, sourcemap: options.sourcemap, analyze: options.analyze })
        logger.success('Client bundle built successfully')

        // 构建统计
        const duration = Date.now() - startTime
        console.log()
        logger.divider()
        logger.success(`Build completed in ${(duration / 1000).toFixed(2)}s`)

        // 显示输出文件
        await printBuildStats(config.build?.outDir || 'dist')

        logger.divider()

        if (options.analyze) {
          logger.info('Bundle analysis available at http://localhost:8888')
        }
      } catch (error) {
        handleError(error as Error)
      }
    })
}

async function printBuildStats(outDir: string) {
  const fs = await import('fs/promises')
  const path = await import('path')
  const { formatBytes } = await import('../utils/format')

  const clientDir = path.join(outDir, 'client')
  const serverDir = path.join(outDir, 'server')

  console.log()
  logger.info('📊 Build Statistics:')
  console.log()

  // 客户端文件
  const clientFiles = await fs.readdir(clientDir)
  for (const file of clientFiles.filter(f => f.endsWith('.js') || f.endsWith('.css'))) {
    const stats = await fs.stat(path.join(clientDir, file))
    console.log(`  client/${file}`.padEnd(40), formatBytes(stats.size))
  }

  console.log()
}
```

#### 任务 2.3: 改造 `start` 命令 (1h)

**目标**: 增强生产服务器命令

**文件**: `src/cli/commands/start.ts`

```typescript
import { Command } from 'commander'
import { logger } from '../utils/logger'
import { loadConfig } from '../utils/config'
import { handleError, Errors } from '../utils/error'
import { startServer } from '../../cli/server'

export function createStartCommand(program: Command) {
  program
    .command('start')
    .description('Start production server')
    .option('-p, --port <port>', 'Port number', '3000')
    .option('-H, --host <host>', 'Host name', '0.0.0.0')
    .action(async (options) => {
      try {
        logger.banner('🚀 Starting production server')

        const config = await loadConfig()
        const port = parseInt(options.port || config.server?.port || 3000)
        const host = options.host || config.server?.host || '0.0.0.0'

        // 检查构建文件是否存在
        const fs = await import('fs')
        const distPath = config.build?.outDir || 'dist'
        if (!fs.existsSync(distPath)) {
          throw new Error('Build files not found. Run "pnpm build" first.')
        }

        // 启动服务器
        const server = await startServer({ port, host, config })

        console.log()
        logger.divider()
        logger.success('Production server is running!')
        console.log()
        logger.info(`  ➜ Local:   http://localhost:${port}`)
        logger.info(`  ➜ Network: http://${host}:${port}`)
        console.log()
        logger.info('Press Ctrl+C to stop')
        logger.divider()

      } catch (error) {
        handleError(error as Error)
      }
    })
}
```

#### 任务 2.4: 实现 `create` 命令 (2.5h)

**目标**: 实现项目脚手架

**文件**: `src/cli/commands/create.ts`

**功能**:
- ✅ 交互式询问配置
- ✅ 模板复制
- ✅ 依赖安装
- ✅ Git 初始化

```typescript
import { Command } from 'commander'
import { logger } from '../utils/logger'
import { handleError } from '../utils/error'
import inquirer from 'inquirer'
import path from 'path'
import fs from 'fs-extra'
import { execSync } from 'child_process'

export function createCreateCommand(program: Command) {
  program
    .command('create <project-name>')
    .description('Create a new project')
    .option('-t, --template <template>', 'Template name', 'basic')
    .option('--no-install', 'Skip dependency installation')
    .option('--no-git', 'Skip git initialization')
    .action(async (projectName, options) => {
      try {
        logger.banner('✨ Creating new React 19 SSR project')

        // 询问配置
        const answers = await inquirer.prompt([
          {
            type: 'list',
            name: 'template',
            message: 'Select a template:',
            default: options.template,
            choices: [
              { name: 'Basic (recommended)', value: 'basic' },
              { name: 'Blog', value: 'blog' },
              { name: 'E-commerce', value: 'ecommerce' },
            ],
          },
          {
            type: 'list',
            name: 'packageManager',
            message: 'Select a package manager:',
            default: 'pnpm',
            choices: ['pnpm', 'npm', 'yarn'],
          },
        ])

        const targetDir = path.resolve(process.cwd(), projectName)

        // 检查目录是否存在
        if (fs.existsSync(targetDir)) {
          throw new Error(`Directory ${projectName} already exists`)
        }

        // 复制模板
        const spinner = logger.startSpinner('Creating project structure...')
        const templateDir = path.resolve(__dirname, '../../templates', answers.template)
        await fs.copy(templateDir, targetDir)
        logger.succeedSpinner('Project structure created')

        // 更新 package.json
        const packageJsonPath = path.join(targetDir, 'package.json')
        const packageJson = await fs.readJSON(packageJsonPath)
        packageJson.name = projectName
        await fs.writeJSON(packageJsonPath, packageJson, { spaces: 2 })

        // 安装依赖
        if (options.install) {
          logger.info('Installing dependencies...')
          process.chdir(targetDir)
          execSync(`${answers.packageManager} install`, { stdio: 'inherit' })
          logger.success('Dependencies installed')
        }

        // Git 初始化
        if (options.git) {
          const gitSpinner = logger.startSpinner('Initializing git repository...')
          execSync('git init', { cwd: targetDir, stdio: 'pipe' })
          execSync('git add .', { cwd: targetDir, stdio: 'pipe' })
          execSync('git commit -m "Initial commit"', { cwd: targetDir, stdio: 'pipe' })
          logger.succeedSpinner('Git repository initialized')
        }

        // 成功提示
        console.log()
        logger.divider()
        logger.success(`Project ${projectName} created successfully!`)
        console.log()
        logger.info('Next steps:')
        console.log(`  cd ${projectName}`)
        if (!options.install) {
          console.log(`  ${answers.packageManager} install`)
        }
        console.log(`  ${answers.packageManager} dev`)
        console.log()
        logger.divider()

      } catch (error) {
        handleError(error as Error)
      }
    })
}
```

---

### Day 3: 用户体验优化 (2025-11-05)

#### 任务 3.1: 终端美化 (2h)

**目标**: 优化终端输出，添加更多视觉元素

**增强内容**:
1. **ASCII Art Logo**
2. **颜色主题统一**
3. **进度条（构建时）**
4. **实时日志滚动**

```typescript
// src/cli/utils/ui.ts
import chalk from 'chalk'
import boxen from 'boxen'

export function printLogo() {
  const logo = `
██████╗ ███████╗ █████╗  ██████╗████████╗    ██╗ █████╗
██╔══██╗██╔════╝██╔══██╗██╔════╝╚══██╔══╝   ███║██╔══██╗
██████╔╝█████╗  ███████║██║        ██║       ╚██║╚██████║
██╔══██╗██╔══╝  ██╔══██║██║        ██║        ██║ ╚═══██║
██║  ██║███████╗██║  ██║╚██████╗   ██║        ██║ █████╔╝
╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝ ╚═════╝   ╚═╝        ╚═╝ ╚════╝

         React 19 SSR Framework with Streaming
  `
  console.log(chalk.cyan(logo))
}

export function printWelcome() {
  console.log(
    boxen(chalk.cyan.bold('Welcome to React 19 SSR Framework!'), {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
    })
  )
}

export function printSuccessBox(message: string) {
  console.log(
    boxen(chalk.green.bold(message), {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'green',
    })
  )
}
```

#### 任务 3.2: 帮助文档完善 (1.5h)

**目标**: 完善 --help 输出

```typescript
// src/cli/index.ts
program
  .name('react19-ssr')
  .description('React 19 SSR Framework CLI')
  .version(version, '-v, --version', 'Output the version number')
  .addHelpText('after', `
Examples:
  $ react19-ssr dev
  $ react19-ssr dev --port 4000
  $ react19-ssr build --analyze
  $ react19-ssr start --port 3000
  $ react19-ssr create my-app

Documentation:
  https://github.com/your-org/react19-ssr-framework

Report Issues:
  https://github.com/your-org/react19-ssr-framework/issues
  `)
```

#### 任务 3.3: 错误提示优化 (1.5h)

**目标**: 提供更友好的错误信息

**改进点**:
- ✅ 错误分类（网络、配置、构建等）
- ✅ 解决方案提示
- ✅ 相关文档链接
- ✅ 常见问题快速修复

```typescript
// src/cli/utils/error.ts (增强版)
export const Errors = {
  PORT_IN_USE: (port: number) =>
    new CLIError(
      `Port ${port} is already in use`,
      'PORT_IN_USE',
      `Try:
  • Use a different port: --port ${port + 1}
  • Kill the process: lsof -ti:${port} | xargs kill -9
  • Check what's using the port: lsof -i:${port}`
    ),

  MODULE_NOT_FOUND: (moduleName: string) =>
    new CLIError(
      `Module "${moduleName}" not found`,
      'MODULE_NOT_FOUND',
      `Try:
  • Install dependencies: pnpm install
  • Check if module is listed in package.json
  • Clear cache: rm -rf node_modules && pnpm install`
    ),

  WEBPACK_BUILD_FAILED: (message: string) =>
    new CLIError(
      `Webpack build failed`,
      'WEBPACK_BUILD_FAILED',
      `Error: ${message}

Troubleshooting:
  • Check syntax errors in your code
  • Verify all imports are correct
  • Run type-check: pnpm type-check
  • Check webpack config: config/webpack.*.ts`
    ),
}
```

#### 任务 3.4: 集成测试 (2h)

**目标**: 测试所有 CLI 命令

**测试用例**:
```bash
# 测试 dev 命令
pnpm react19-ssr dev
pnpm react19-ssr dev --port 4000
pnpm react19-ssr dev --help

# 测试 build 命令
pnpm react19-ssr build
pnpm react19-ssr build --analyze
pnpm react19-ssr build --no-sourcemap

# 测试 start 命令
pnpm react19-ssr start
pnpm react19-ssr start --port 5000

# 测试 create 命令
pnpm react19-ssr create test-app
pnpm react19-ssr create test-app --template blog --no-install

# 测试 help 和 version
pnpm react19-ssr --help
pnpm react19-ssr --version
```

---

## 5. 技术选型（已修订）

### 5.1 核心依赖（Phase 8 MVP）

| 包名 | 版本 | 用途 | CommonJS 兼容 | 优先级 |
|------|------|------|--------------|--------|
| `commander` | ^11.1.0 | CLI 框架 | ✅ 是 | 🔴 必须 |
| `chalk` | ^4.1.2 | 彩色输出 | ✅ 是 | 🔴 必须 |
| `ora` | ^5.4.1 | Spinner 动画 | ✅ 是 | 🔴 必须 |

**为什么是 v4/v5 而不是最新版本？**
- ✅ chalk@4, ora@5 支持 CommonJS（`require()`）
- ❌ chalk@5+, ora@8+ 只支持 ESM（`import`）
- 📦 项目使用 `"type": "commonjs"`，必须使用兼容版本

### 5.2 可选依赖（Phase 8.5+）

| 包名 | 版本 | 用途 | 使用场景 |
|------|------|------|---------|
| `inquirer` | ^8.2.6 | 交互式询问 | create 命令 |
| `boxen` | ^5.1.2 | 边框文本 | 终端美化 |
| `fs-extra` | ^11.2.0 | 文件操作 | create 命令 |
| `open` | ^8.4.2 | 打开浏览器 | --open 参数 |

### 5.3 安装命令

**Phase 8 MVP (立即安装)**:
```bash
pnpm add -D commander@^11.1.0 chalk@^4.1.2 ora@^5.4.1
```

**Phase 8.5+ (可选，按需安装)**:
```bash
pnpm add -D inquirer@^8.2.6 boxen@^5.1.2 fs-extra@^11.2.0 open@^8.4.2
pnpm add -D @types/inquirer @types/fs-extra
```

---

## 6. 文件结构

```
src/cli/
├── index.ts                 # CLI 入口（新增）
├── commands/                # 命令实现（新增）
│   ├── dev.ts              # dev 命令
│   ├── build.ts            # build 命令
│   ├── start.ts            # start 命令
│   └── create.ts           # create 命令
├── utils/                   # 工具函数（新增）
│   ├── logger.ts           # 日志系统
│   ├── config.ts           # 配置加载
│   ├── error.ts            # 错误处理
│   ├── ui.ts               # UI 组件
│   └── format.ts           # 格式化工具
├── templates/              # 项目模板（新增）
│   ├── basic/              # 基础模板
│   ├── blog/               # 博客模板
│   └── ecommerce/          # 电商模板
├── dev.ts                  # 旧文件，逐步迁移
├── build.ts                # 旧文件，逐步迁移
├── start.ts                # 旧文件，逐步迁移
└── server.ts               # 保留，被 start 命令使用

package.json:
{
  "bin": {
    "react19-ssr": "./dist/cli/index.js"  // CLI 入口
  }
}
```

---

## 7. 实施时间表（已修订）

### Day 1: 2025-11-03 (基础设施 + 核心命令)

| 时间 | 任务 | 预计 | 状态 |
|------|------|------|------|
| 09:00-09:30 | 安装依赖 + 环境准备 | 0.5h | - |
| 09:30-11:00 | CLI 框架搭建 (index.ts + commander) | 1.5h | - |
| 11:00-12:00 | 日志系统 (logger.ts) | 1h | - |
| 14:00-15:00 | 错误处理 (error.ts) | 1h | - |
| 15:00-15:30 | 端口检查 (port.ts) | 0.5h | - |
| 15:30-17:30 | 改造 dev 命令 | 2h | - |

**输出**: CLI 基础框架 + dev 命令增强

### Day 2: 2025-11-04 (命令完善 + 测试)

| 时间 | 任务 | 预计 | 状态 |
|------|------|------|------|
| 09:00-10:30 | 改造 build 命令 | 1.5h | - |
| 10:30-11:30 | 改造 start 命令 | 1h | - |
| 11:30-12:30 | 添加 --help 和 --version | 1h | - |
| 14:00-16:00 | 集成测试（所有命令） | 2h | - |
| 16:00-17:30 | 文档更新 + Bug 修复 | 1.5h | - |

**输出**: 完整的 CLI MVP (dev/build/start + help)

### Day 3: 2025-11-05 (可选增强 - 按需实施)

| 时间 | 任务 | 预计 | 状态 |
|------|------|------|------|
| 09:00-11:00 | 配置文件系统 (可选) | 2h | 可选 |
| 11:00-13:00 | create 命令 (可选) | 2h | 可选 |
| 14:00-15:30 | 终端美化增强 | 1.5h | 可选 |
| 15:30-17:00 | 最终测试 + 打包 | 1.5h | 可选 |

**输出**: 增强功能（根据实际需求决定是否实施）

---

## 8. 验收标准

### 8.1 功能验收

```bash
✅ react19-ssr --version        # 显示版本号
✅ react19-ssr --help           # 显示帮助文档
✅ react19-ssr dev              # 启动开发服务器
✅ react19-ssr dev --port 4000  # 自定义端口
✅ react19-ssr build            # 生产构建
✅ react19-ssr build --analyze  # Bundle 分析
✅ react19-ssr start            # 启动生产服务器
✅ react19-ssr create my-app    # 创建新项目
```

### 8.2 用户体验验收

```
✅ 启动输出美观（Logo + Banner）
✅ 进度提示清晰（Spinner + 进度条）
✅ 错误信息友好（带解决方案）
✅ 帮助文档完整（示例 + 文档链接）
✅ 彩色日志区分（info/success/warn/error）
✅ 构建统计详细（文件大小 + 耗时）
```

### 8.3 性能验收

```
✅ CLI 启动时间 < 500ms
✅ 配置加载时间 < 100ms
✅ 命令响应时间 < 100ms
```

### 8.4 兼容性验收

```
✅ Node.js >= 18
✅ pnpm/npm/yarn 都支持
✅ macOS/Linux/Windows 兼容
```

---

## 9. 风险与对策（已更新）

### 风险 1: ESM/CommonJS 兼容性问题 🔴 **已修复**

**影响**: 使用 ESM-only 包导致项目无法运行

**对策**:
- ✅ 使用 chalk@4, ora@5 (CommonJS 兼容版本)
- ✅ 避免使用 chalk@5+, ora@8+ (ESM-only)
- ✅ 保持项目 `"type": "commonjs"`

### 风险 2: 功能范围过大 🟡 **已修复**

**影响**: 3天内无法完成所有功能

**对策**:
- ✅ 分为 MVP (2天) + 可选增强 (1天)
- ✅ create 命令推迟到 Phase 9
- ✅ 配置文件系统改为可选功能

### 风险 3: 与现有代码集成复杂 🟡

**影响**: 现有 dev/build/start 脚本需要重构

**对策**:
- ✅ 渐进式改造，保持现有行为
- ✅ 通过函数包装而非重写
- ✅ 充分测试集成点

### 风险 4: 依赖包体积增大 🟢

**影响**: CLI 安装时间变长

**评估**: 可接受
- commander: ~116KB
- chalk@4: ~18KB
- ora@5: ~30KB
- **总计**: ~164KB (可接受)

**对策**:
- ✅ 只安装必须依赖
- ✅ 可选依赖按需安装

---

## 10. Phase 8 MVP 快速开始

### 10.1 立即开始（推荐步骤）

**Step 1: 安装依赖** (5分钟)
```bash
cd /Users/lihuiwen/Desktop/project/react19-ssr-project
pnpm add -D commander@^11.1.0 chalk@^4.1.2 ora@^5.4.1
```

**Step 2: 创建基础文件结构** (10分钟)
```bash
mkdir -p src/cli/utils
mkdir -p src/cli/commands

# 创建空文件
touch src/cli/index.ts
touch src/cli/utils/logger.ts
touch src/cli/utils/error.ts
touch src/cli/utils/port.ts
touch src/cli/commands/dev.ts
touch src/cli/commands/build.ts
touch src/cli/commands/start.ts
```

**Step 3: 开始实施 Day 1 任务**

按照 Day 1 时间表依次实现：
1. CLI 框架搭建 (1.5h)
2. 日志系统 (1h)
3. 错误处理 (1h)
4. 端口检查 (0.5h)
5. 改造 dev 命令 (2h)

### 10.2 验证安装

```bash
# 检查依赖版本
pnpm list commander chalk ora

# 预期输出：
# commander 11.1.0
# chalk 4.1.2
# ora 5.4.1
```

## 11. 后续优化（Phase 8.5+）

### Phase 9 可选增强

1. **配置文件系统**
   ```bash
   # app.config.js (CommonJS)
   module.exports = {
     server: { port: 4000 },
     routes: { pagesDir: 'src/pages' }
   }
   ```

2. **create 命令**
   ```bash
   react19-ssr create my-app
   # 复制 examples/basic 作为模板
   ```

3. **终端美化增强**
   - ASCII Art Logo
   - 进度条（构建时）
   - 更多颜色主题

4. **插件系统**（Phase 10+）
   ```typescript
   // app.config.ts
   export default {
     plugins: [
       '@react19-ssr/plugin-tailwind',
       '@react19-ssr/plugin-pwa',
     ]
   }
   ```

---

## 附录

### A. 参考项目

- **Next.js CLI**: https://github.com/vercel/next.js/tree/canary/packages/next/cli
- **Vite CLI**: https://github.com/vitejs/vite/tree/main/packages/vite/src/node/cli.ts
- **Create React App**: https://github.com/facebook/create-react-app

### B. 相关文档

- Commander.js: https://github.com/tj/commander.js
- Chalk: https://github.com/chalk/chalk
- Ora: https://github.com/sindresorhus/ora
- Inquirer: https://github.com/SBoudrias/Inquirer.js

### C. 设计原则

1. **渐进式增强**: 不破坏现有功能
2. **约定优于配置**: 提供合理默认值
3. **友好错误提示**: 帮助用户快速解决问题
4. **性能优先**: CLI 响应要快
5. **可扩展性**: 预留插件接口

---

## 12. 修订说明

### v2.0 (2025-11-03) - 重大修订

**修复的问题**:
1. 🔴 **ESM/CommonJS 冲突**: 将 chalk@5/ora@8 降级到 chalk@4/ora@5
2. 🟡 **功能范围过大**: create 命令推迟，聚焦 MVP
3. 🟡 **缺失函数实现**: 添加 `checkPort()` 完整实现
4. 🟡 **时间规划不合理**: 从 3天平均分配改为 2天 MVP + 1天可选

**保留的内容**:
- ✅ 整体架构设计（commander + chalk + ora）
- ✅ 渐进式改造策略
- ✅ 详细的代码示例
- ✅ 完善的错误处理设计

**新增内容**:
- ✅ CommonJS/ESM 兼容性分析
- ✅ MVP 优先级划分
- ✅ 端口检查工具完整实现
- ✅ 快速开始指南

### v1.0 (2025-11-03) - 初始版本

- 完整的 3天实施计划
- 包含 create 命令和配置文件系统
- 使用最新版本依赖（chalk@5, ora@8）

---

## 13. 总结与建议

### ✅ 推荐行动

1. **立即开始 Phase 8 MVP** (2天)
   - 安装兼容依赖：`pnpm add -D commander@^11.1.0 chalk@^4.1.2 ora@^5.4.1`
   - 按照 Day 1-2 时间表实施
   - 聚焦核心命令增强（dev/build/start）

2. **推迟可选功能** (Phase 9)
   - create 命令
   - 配置文件系统
   - 终端美化增强

3. **保持灵活性**
   - 根据实际进度调整
   - Day 3 作为 buffer 或增强功能

### 📊 成功指标

- ✅ `pnpm dev` 启动美观，支持 --port 参数
- ✅ `pnpm build` 显示进度和统计信息
- ✅ `pnpm start` 检查构建文件并友好提示
- ✅ `pnpm react19-ssr --help` 显示完整帮助
- ✅ `pnpm react19-ssr --version` 显示版本号
- ✅ 所有命令错误提示友好

### 🎯 预期效果

**改进前**:
```bash
$ pnpm dev
🔧 Starting development mode with HMR...
[大量日志输出...]
```

**改进后**:
```bash
$ pnpm dev

🚀 React 19 SSR Framework
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Configuration loaded
✓ Development server is ready!

  ➜ Local:   http://localhost:3000
  ➜ Network: http://192.168.1.100:3000

Press Ctrl+C to stop
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

**文档维护者**: React 19 SSR Framework Team
**创建日期**: 2025-11-03
**修订日期**: 2025-11-03 (v2.0)
**状态**: 📋 待实施 (已审查和修订)
