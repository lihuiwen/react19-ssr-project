# HMR (Hot Module Replacement) 完整解决方案

## 架构概述

本项目采用**双服务器架构**，将 HMR 功能与 SSR 服务完全分离：

```
┌─────────────────────┐         ┌──────────────────────┐
│   HMR Server        │         │   SSR Server         │
│   Port: 3001        │         │   Port: 3000         │
├─────────────────────┤         ├──────────────────────┤
│ - Express           │         │ - Koa                │
│ - Webpack Compiler  │         │ - SSR Rendering      │
│ - Dev Middleware    │         │ - Static Files       │
│ - Hot Middleware    │         │ - Require Cache      │
│ - SSE Connection    │         │                      │
└─────────────────────┘         └──────────────────────┘
         │                               │
         │  HMR Updates (SSE)            │  HTML/Static
         └───────────────┬───────────────┘
                         │
                    ┌────▼─────┐
                    │ Browser  │
                    │ - bundle.js (from HMR Server)
                    │ - HMR Client connects to :3001
                    └──────────┘
```

## 核心文件

### 1. HMR 服务器 (`src/server/hmr-server.js`)

专门负责 Webpack 编译和热更新推送。

```javascript
const express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const clientConfig = require('../../config/webpack.client');

const app = express();
const HMR_PORT = process.env.HMR_PORT || 3001;

const compiler = webpack(clientConfig);

// Dev middleware - 编译客户端代码
const devMiddleware = webpackDevMiddleware(compiler, {
  publicPath: clientConfig.output.publicPath,
  serverSideRender: true,
  writeToDisk: true, // 写入磁盘供 SSR 使用
  stats: { colors: true, modules: false, children: false, chunks: false },
});

// Hot middleware - 提供 HMR 更新
const hotMiddleware = webpackHotMiddleware(compiler, {
  log: console.log,
  path: '/__webpack_hmr',
  heartbeat: 2000,
});

app.use(devMiddleware);
app.use(hotMiddleware);
app.use('/static', express.static('dist/client'));

devMiddleware.waitUntilValid(() => {
  app.listen(HMR_PORT, () => {
    console.log(`🔥 HMR server running on http://localhost:${HMR_PORT}`);
  });
});
```

**职责：**
- 编译客户端代码（bundle.js）
- 监听源文件变化
- 生成 hot-update.js 文件
- 通过 SSE 推送更新到浏览器
- 提供静态文件服务

### 2. SSR 服务器 (`src/server/dev-server.js`)

专门负责服务端渲染。

```javascript
const Koa = require('koa');
const serve = require('koa-static');
const mount = require('koa-mount');
const path = require('path');

const app = new Koa();
const PORT = process.env.PORT || 3000;

// 挂载静态文件服务（bundle.js 由 HMR 服务器编译）
app.use(mount('/static', serve(path.resolve(__dirname, '../../dist/client'))));

// SSR 中间件
app.use(async (ctx) => {
  // 清除 require cache 以获取最新的服务端代码
  const serverIndexPath = path.resolve(__dirname, '../../dist/server/index.js');

  Object.keys(require.cache).forEach((key) => {
    if (key.includes('/dist/server/')) {
      delete require.cache[key];
    }
  });

  try {
    const renderMiddleware = require(serverIndexPath).default || require(serverIndexPath);
    await renderMiddleware(ctx);
  } catch (error) {
    console.error('SSR Error:', error);
    ctx.status = 500;
    ctx.body = `Internal Server Error: ${error.message}`;
  }
});

const server = app.listen(PORT, () => {
  console.log(`🚀 SSR server running on http://localhost:${PORT}`);
});

// 优雅关闭 - 确保 nodemon 重启时端口被正确释放
process.on('SIGTERM', () => {
  console.log('\n🔄 SSR server restarting...');
  server.close(() => {
    console.log('✅ SSR server closed gracefully');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n👋 SSR server shutting down...');
  server.close(() => {
    console.log('✅ SSR server closed');
    process.exit(0);
  });
});
```

**职责：**
- 服务端渲染 React 应用
- 提供 HTML 页面
- 服务静态文件（从 dist 读取）
- 通过 require cache 清理保证使用最新代码
- 优雅关闭避免端口占用问题

### 3. Webpack 客户端配置 (`config/webpack.client.js`)

配置 HMR 客户端连接地址。

```javascript
module.exports = {
  mode: 'development',
  entry: [
    // 指向 HMR 服务器的完整 URL
    'webpack-hot-middleware/client?path=http://localhost:3001/__webpack_hmr&reload=true&timeout=20000',
    paths.clientEntry,
  ],
  output: {
    path: paths.clientOutput,
    filename: 'bundle.js',
    publicPath: '/static/',
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
  ],
  // ...其他配置
};
```

**关键参数：**
- `path`: HMR 服务器的完整 URL（跨端口）
- `reload=true`: HMR 失败时自动刷新页面
- `timeout=20000`: 连接超时时间（毫秒）

### 4. 客户端入口 (`src/client/index.js`)

正确处理 HMR 更新。

```javascript
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { renderRoutes } from 'react-router-config';

const rootElement = document.getElementById('root');

function render() {
  // 在 HMR 回调中重新导入 routes 以获取最新版本
  const routes = require('../app/routes').default || require('../app/routes');

  const App = () => (
    <BrowserRouter>
      {renderRoutes(routes)}
    </BrowserRouter>
  );

  // 首次用 hydrate，HMR 更新用 render
  if (module.hot && module.hot.data) {
    ReactDOM.render(<App />, rootElement);
  } else {
    ReactDOM.hydrate(<App />, rootElement);
  }
}

render();

// 接受 routes 模块及其所有依赖的更新
if (module.hot) {
  module.hot.accept('../app/routes', () => {
    console.log('🔥 Hot Module Replacement triggered');
    render();
  });
}
```

**关键点：**
- 使用 `require()` 动态导入以获取最新模块
- `module.hot.data` 判断是否为 HMR 更新
- 只有一个 `accept()` 调用，避免冲突
- 接受 routes 会级联触发所有依赖组件的更新

### 5. 启动脚本 (`scripts/dev.js`)

协调启动两个服务器。

```javascript
const webpack = require('webpack');
const { spawn } = require('child_process');
const serverConfig = require('../config/webpack.server');

let hmrServerProcess = null;
let ssrServerProcess = null;
let isInitialBuild = true;

// 编译服务端代码
const serverCompiler = webpack(serverConfig);

serverCompiler.watch({}, (err, stats) => {
  if (err || stats.hasErrors()) {
    console.error('Server build error');
    return;
  }

  console.log('✅ Server bundle built');

  if (isInitialBuild) {
    isInitialBuild = false;

    // 1. 启动 HMR 服务器
    console.log('🔥 Starting HMR server on port 3001...');
    hmrServerProcess = spawn('node', ['src/server/hmr-server.js'], {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, HMR_PORT: '3001' }
    });

    // 2. 延迟启动 SSR 服务器
    setTimeout(() => {
      console.log('🔄 Starting SSR server on port 3000...');
      ssrServerProcess = spawn('npx', [
        'nodemon',
        '--watch', 'src/server',  // 只监听服务端源码
        '--ext', 'js,jsx',
        '--delay', '1000ms',  // 重启前等待 1 秒，确保端口释放
        '--signal', 'SIGTERM',  // 发送 SIGTERM 触发优雅关闭
        'src/server/dev-server.js'
      ], { stdio: 'inherit', shell: true });
    }, 2000);
  }
});

// 处理进程终止
process.on('SIGINT', () => {
  console.log('\\n👋 Shutting down...');
  if (hmrServerProcess) hmrServerProcess.kill();
  if (ssrServerProcess) ssrServerProcess.kill();
  process.exit(0);
});
```

**启动顺序：**
1. 编译服务端代码
2. 启动 HMR 服务器（3001）
3. 等待 2 秒
4. 启动 SSR 服务器（3000，使用 nodemon）

## 工作流程

### 修改客户端代码（React 组件）

```
1. 保存 src/app/pages/Home/index.jsx
   ↓
2. HMR 服务器 (3001) 检测文件变化
   ↓
3. Webpack 重新编译客户端代码
   ↓
4. 生成 main.xxx.hot-update.js
   ↓
5. 通过 http://localhost:3001/__webpack_hmr 推送更新（SSE）
   ↓
6. 浏览器 HMR Runtime 接收更新
   ↓
7. 触发 module.hot.accept() 回调
   ↓
8. 执行 render() 重新渲染应用
   ↓
9. 页面自动更新！✅
   ↓
10. Webpack 同时编译服务端代码（用于 SSR）
    SSR 服务器不重启！✅
```

### 修改服务端代码

```
1. 保存 src/server/template.js 或 src/server/middlewares/render.js
   ↓
2. nodemon 检测到 src/server 目录变化
   ↓
3. 发送 SIGTERM 信号给旧的 SSR 服务器
   ↓
4. 旧服务器执行 server.close() 优雅关闭，释放 3000 端口
   ↓
5. 等待 1 秒（nodemon --delay 1000ms）
   ↓
6. 启动新的 SSR 服务器进程 (3000)
   ↓
7. HMR 服务器 (3001) 继续运行，客户端连接不中断 ✅
   ↓
8. 需要手动刷新浏览器查看服务端变化
```

## 优势

### 1. 职责清晰分离
- **HMR 服务器**：专注前端编译和热更新
- **SSR 服务器**：专注服务端渲染

### 2. 独立重启
- 修改客户端代码 → 只有 Webpack 重新编译，SSR 不受影响
- 修改服务端代码 → 只有 SSR 服务器重启，HMR 连接不中断

### 3. 端口隔离
- **3000**：用户访问（SSR）
- **3001**：开发工具（HMR）

### 4. 技术栈最优选择
- HMR: Express（webpack 中间件原生支持）
- SSR: Koa（现代、简洁）

### 5. 稳定的 HMR 连接
- SSE 长连接不会因 SSR 服务器重启而中断
- 避免 `ERR_INCOMPLETE_CHUNKED_ENCODING` 错误

## 使用方法

### 启动开发服务器

```bash
pnpm run dev
```

这会启动：
1. Webpack 服务端代码编译监听
2. HMR 服务器（http://localhost:3001）
3. SSR 服务器（http://localhost:3000）

### 访问地址

- **应用入口**: http://localhost:3000
- **HMR 端点**: http://localhost:3001/__webpack_hmr
- **静态文件**: http://localhost:3000/static/bundle.js

### 测试 HMR

1. **启动服务器**
   ```bash
   pnpm run dev
   ```

2. **在浏览器打开**
   - 访问 http://localhost:3000
   - F12 打开开发者工具
   - 查看 Console 和 Network 标签

3. **验证 HMR 连接**
   - Network 标签应该有 `__webpack_hmr` 请求
   - 连接到 `http://localhost:3001/__webpack_hmr`
   - 状态：pending（持续连接）

4. **修改代码测试**
   ```jsx
   // 编辑 src/app/pages/Home/index.jsx
   <h2 className={styles.title}>Home Page - HMR Works! 🔥</h2>
   ```

5. **预期结果**
   - ✅ 浏览器自动更新，无需刷新
   - ✅ 控制台显示：`🔥 Hot Module Replacement triggered`
   - ✅ HMR 服务器日志：`webpack built xxx in XXms`
   - ✅ SSR 服务器没有重启
   - ✅ 组件状态保持不变

### 命令行验证

```bash
# 测试 HMR 端点
curl -N http://localhost:3001/__webpack_hmr

# 应该看到 SSE 数据流
# data: {"action":"sync",...}
```

## 故障排除

### 问题 1: HMR 连接失败

**症状**：浏览器控制台显示无法连接到 3001 端口

**解决方案**：
1. 确认 HMR 服务器正在运行：
   ```bash
   lsof -i :3001
   ```
2. 检查防火墙是否阻止 3001 端口
3. 查看 webpack 配置中的 HMR 路径是否正确

### 问题 2: 页面不自动更新

**症状**：修改代码后浏览器不更新

**解决方案**：
1. 检查浏览器 Network 标签，`__webpack_hmr` 连接是否正常
2. 查看浏览器控制台是否有 HMR 错误
3. 确认终端 HMR 服务器是否编译成功
4. 刷新页面重新建立 HMR 连接

### 问题 3: bundle.js 加载失败

**症状**：404 错误或文件大小不对

**解决方案**：
1. 确认 HMR 服务器已完成首次编译
2. 检查 `dist/client/bundle.js` 是否存在
3. 验证 webpack 配置：`writeToDisk: true`
4. 检查 SSR 服务器的静态文件配置

### 问题 4: ERR_INCOMPLETE_CHUNKED_ENCODING

**症状**：HMR 连接中断错误

**原因**：SSR 服务器重启导致 SSE 连接中断

**解决方案**：
- 确认 nodemon 只监听 `src/server` 目录
- 不要监听 `dist/server` 目录
- 客户端代码变化不应触发 SSR 服务器重启

### 问题 5: 服务端文件修改后端口占用 (EADDRINUSE)

**症状**：修改服务端文件保存后，nodemon 重启时报错：`Error: listen EADDRINUSE: address already in use :::3000`

**原因**：nodemon 重启时，旧的服务器进程还没完全关闭，端口未释放

**解决方案**：

1. **在 dev-server.js 中添加优雅关闭逻辑**：
   ```javascript
   const server = app.listen(PORT, () => {
     console.log(`🚀 SSR server running on http://localhost:${PORT}`);
   });

   process.on('SIGTERM', () => {
     server.close(() => {
       process.exit(0);
     });
   });
   ```

2. **在 nodemon 配置中添加延迟和信号**：
   ```javascript
   spawn('npx', [
     'nodemon',
     '--delay', '1000ms',  // 重启前等待
     '--signal', 'SIGTERM',  // 发送正确的关闭信号
     'src/server/dev-server.js'
   ]);
   ```

**工作流程**：
1. Nodemon 检测到文件变化
2. 发送 SIGTERM 信号
3. 旧服务器调用 `server.close()` 释放端口
4. 等待 1 秒确保端口完全释放
5. 启动新服务器进程
6. HMR 服务器不受影响，客户端连接保持 ✅

## 关键技术点

### 1. 跨端口 HMR 连接

```javascript
// webpack.client.js
entry: [
  'webpack-hot-middleware/client?path=http://localhost:3001/__webpack_hmr&...',
  paths.clientEntry,
]
```

必须使用完整 URL（包含协议和域名）才能跨端口连接。

### 2. SSE (Server-Sent Events)

HMR 使用 SSE 建立长连接：
- 单向通信（服务器 → 客户端）
- 自动重连机制
- 基于 HTTP，兼容性好

### 3. Require Cache 清理

```javascript
Object.keys(require.cache).forEach((key) => {
  if (key.includes('/dist/server/')) {
    delete require.cache[key];
  }
});
```

确保 SSR 服务器在不重启的情况下也能获取最新代码。

### 4. module.hot.accept()

```javascript
module.hot.accept('../app/routes', callback)
```

- 接受指定模块的更新
- 回调函数中重新导入模块
- 触发重新渲染

### 5. hydrate vs render

- **hydrate**：首次加载，激活 SSR 内容
- **render**：HMR 更新，完全重新渲染

```javascript
if (module.hot && module.hot.data) {
  ReactDOM.render(<App />, rootElement);  // HMR
} else {
  ReactDOM.hydrate(<App />, rootElement); // 首次
}
```

## 生产环境

生产环境不需要 HMR：

```bash
# 构建
pnpm run build

# 运行（只启动 SSR 服务器）
pnpm start
```

生产环境配置：
- 不启动 HMR 服务器
- bundle.js 预先编译并部署到 CDN
- 使用生产模式的 webpack 配置

## 总结

双服务器 HMR 架构的优势：
- ✅ 职责分离，架构清晰
- ✅ HMR 连接稳定，不受 SSR 影响
- ✅ 开发体验极佳，修改立即生效
- ✅ 易于调试和维护
- ✅ 为未来扩展打下良好基础

现在你可以愉快地开发了！保存文件后立即在浏览器中看到效果，无需手动刷新！🎉
