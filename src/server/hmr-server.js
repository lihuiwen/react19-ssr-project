/**
 * HMR Server (Port 3001)
 * Responsible for:
 * - Compiling client code with Webpack
 * - Pushing hot updates via SSE
 * - Serving static files
 */

// Register TypeScript compiler for .ts files
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
  },
})

const express = require('express')
const webpack = require('webpack')
const webpackDevMiddleware = require('webpack-dev-middleware')
const webpackHotMiddleware = require('webpack-hot-middleware')
const cors = require('cors')
const path = require('path')

const app = express()
const HMR_PORT = process.env.HMR_PORT || 3001

// Enable CORS for cross-origin requests from SSR server (port 3000)
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}))

// Load webpack dev configuration (TypeScript)
const webpackConfigPath = path.resolve(__dirname, '../build/webpack.dev.ts')
const configModule = require(webpackConfigPath)
const webpackConfig = configModule.default || configModule

// Create webpack compiler
const compiler = webpack(webpackConfig)

// Dev middleware - compiles client code
const devMiddleware = webpackDevMiddleware(compiler, {
  publicPath: webpackConfig.output.publicPath,
  serverSideRender: true,
  writeToDisk: true, // Write to disk so SSR server can read files
  stats: {
    colors: true,
    modules: false,
    children: false,
    chunks: false,
    chunkModules: false,
  },
})

// Hot middleware - provides HMR updates via SSE
const hotMiddleware = webpackHotMiddleware(compiler, {
  log: console.log,
  path: '/__webpack_hmr',
  heartbeat: 2000, // Send heartbeat every 2 seconds
})

app.use(devMiddleware)
app.use(hotMiddleware)

// Serve static files from dist/client
app.use('/static', express.static(path.resolve(__dirname, '../../dist/client')))
app.use('/', express.static(path.resolve(__dirname, '../../dist/client')))

// Wait for initial compilation to complete
devMiddleware.waitUntilValid(() => {
  app.listen(HMR_PORT, () => {
    console.log(`\n🔥 HMR server running on http://localhost:${HMR_PORT}`)
    console.log(`   - Webpack compiler ready`)
    console.log(`   - Hot updates: http://localhost:${HMR_PORT}/__webpack_hmr`)
    console.log(`   - Static files: http://localhost:${HMR_PORT}/\n`)
  })
})

// Error handling
compiler.hooks.done.tap('HMR-Server', (stats) => {
  if (stats.hasErrors()) {
    console.error('❌ Compilation failed')
    console.error(stats.toString({ colors: true, chunks: false }))
  } else {
    const time = stats.endTime - stats.startTime
    console.log(`✅ Compiled successfully in ${time}ms`)
  }
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n👋 HMR server shutting down...')
  devMiddleware.close()
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('\n👋 HMR server shutting down...')
  devMiddleware.close()
  process.exit(0)
})
