#!/usr/bin/env node

/**
 * Development Startup Script
 * Coordinates the startup of both HMR and SSR servers
 *
 * Startup sequence:
 * 1. Compile server code (watch mode)
 * 2. Start HMR server (port 3001)
 * 3. Wait for HMR server to be ready
 * 4. Start SSR server (port 3000, with nodemon)
 */

// Register TypeScript compiler for .ts files
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
  },
})

const webpack = require('webpack')
const { spawn } = require('child_process')
const path = require('path')

// Track process state
let hmrServerProcess = null
let ssrServerProcess = null
let isInitialBuild = true
let isShuttingDown = false

console.log('🚀 Starting React 19 SSR Framework Development Environment\n')

// Load webpack server configuration (TypeScript)
const serverConfigPath = path.resolve(__dirname, '../src/build/webpack.server.ts')
const serverConfigModule = require(serverConfigPath)
const serverConfig = serverConfigModule.default || serverConfigModule

// Create server compiler with watch mode
const serverCompiler = webpack(serverConfig)

console.log('📦 Compiling server bundle (watch mode)...')

serverCompiler.watch(
  {
    aggregateTimeout: 300,
    poll: undefined,
  },
  (err, stats) => {
    if (err) {
      console.error('❌ Server compilation failed:', err)
      return
    }

    if (stats.hasErrors()) {
      console.error('❌ Server build errors:')
      console.error(
        stats.toString({
          colors: true,
          chunks: false,
          modules: false,
        })
      )
      return
    }

    const buildTime = stats.endTime - stats.startTime
    console.log(`✅ Server bundle built successfully in ${buildTime}ms`)

    // Only start servers after first successful build
    if (isInitialBuild) {
      isInitialBuild = false
      startServers()
    }
  }
)

/**
 * Start both HMR and SSR servers
 */
function startServers() {
  console.log('\n📡 Starting servers...\n')

  // 1. Start HMR server first
  console.log('🔥 Starting HMR server on port 3001...')
  hmrServerProcess = spawn('node', ['src/server/hmr-server.js'], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      HMR_PORT: '3001',
      NODE_ENV: 'development',
    },
  })

  hmrServerProcess.on('error', (error) => {
    console.error('❌ HMR server error:', error)
  })

  hmrServerProcess.on('exit', (code) => {
    if (!isShuttingDown) {
      console.log(`⚠️  HMR server exited with code ${code}`)
    }
  })

  // 2. Wait for HMR server to be ready, then start SSR server
  setTimeout(() => {
    console.log('\n🚀 Starting SSR server on port 3000...')
    console.log('   Using nodemon for server-side hot reload\n')

    ssrServerProcess = spawn(
      'npx',
      [
        'nodemon',
        '--watch', 'src/server', // Watch server directory
        '--watch', 'dist/server', // Watch compiled server bundle
        '--ext', 'js,ts', // File extensions to watch
        '--delay', '3000ms', // Wait 3s before restarting (for port release)
        '--signal', 'SIGTERM', // Graceful shutdown signal
        'src/server/dev-server.js', // Script to run
      ],
      {
        stdio: 'inherit',
        shell: true,
        env: {
          ...process.env,
          PORT: '3000',
          NODE_ENV: 'development',
        },
      }
    )

    ssrServerProcess.on('error', (error) => {
      console.error('❌ SSR server error:', error)
    })

    ssrServerProcess.on('exit', (code) => {
      if (!isShuttingDown) {
        console.log(`⚠️  SSR server exited with code ${code}`)
      }
    })

    // Print success message
    setTimeout(() => {
      console.log('\n' + '='.repeat(60))
      console.log('✅ Development environment is ready!')
      console.log('='.repeat(60))
      console.log('\n📱 Your application:')
      console.log('   → http://localhost:3000')
      console.log('\n🔧 Development servers:')
      console.log('   → HMR Server: http://localhost:3001 (Webpack Dev Server)')
      console.log('   → SSR Server: http://localhost:3000 (Koa with SSR)')
      console.log('\n📝 Features:')
      console.log('   ✓ Hot Module Replacement (HMR)')
      console.log('   ✓ React Fast Refresh')
      console.log('   ✓ Server-side hot reload (nodemon)')
      console.log('   ✓ Streaming SSR with React 19')
      console.log('   ✓ TypeScript compilation')
      console.log('\n💡 Tips:')
      console.log('   • Modify components → instant update (no refresh)')
      console.log('   • Modify server code → automatic restart')
      console.log('   • Check browser console for HMR status')
      console.log('\nPress Ctrl+C to stop all servers\n')
    }, 2000)
  }, 3000) // Wait 3 seconds for HMR server to be ready
}

/**
 * Graceful shutdown handler
 */
function shutdown() {
  if (isShuttingDown) {
    return
  }

  isShuttingDown = true
  console.log('\n👋 Shutting down development environment...')

  // Stop webpack watch
  serverCompiler.close(() => {
    console.log('✅ Webpack watch stopped')
  })

  // Kill HMR server
  if (hmrServerProcess) {
    console.log('🔥 Stopping HMR server...')
    hmrServerProcess.kill('SIGTERM')
  }

  // Kill SSR server
  if (ssrServerProcess) {
    console.log('🚀 Stopping SSR server...')
    ssrServerProcess.kill('SIGTERM')
  }

  // Wait a bit for processes to clean up
  setTimeout(() => {
    console.log('✅ All servers stopped')
    process.exit(0)
  }, 1000)
}

// Handle shutdown signals
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error)
  shutdown()
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled rejection at:', promise, 'reason:', reason)
  shutdown()
})
