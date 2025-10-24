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
