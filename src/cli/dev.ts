/**
 * Development Script (Phase 1)
 * Basic development mode - will be enhanced in Phase 6 with HMR
 */

import webpack from 'webpack'
import { spawn } from 'child_process'
import clientConfig from '../build/webpack.client'
import serverConfig from '../build/webpack.server'

console.log('🔧 Starting development mode...\n')

let serverProcess: any = null

// Build client and server in watch mode
const compiler = webpack([clientConfig, serverConfig])

let isFirstBuild = true

compiler.watch(
  {
    aggregateTimeout: 300,
    poll: undefined,
  },
  (err, stats) => {
    if (err) {
      console.error('❌ Build failed:', err)
      return
    }

    if (!stats) {
      return
    }

    // Print build results
    console.log(
      stats.toString({
        colors: true,
        modules: false,
        children: false,
        chunks: false,
        chunkModules: false,
      })
    )

    if (stats.hasErrors()) {
      console.error('\n❌ Build failed with errors')
      return
    }

    // On successful build, restart server
    if (isFirstBuild || !stats.hasErrors()) {
      restartServer()
      isFirstBuild = false
    }
  }
)

function restartServer() {
  // Kill existing server
  if (serverProcess) {
    console.log('\n🔄 Restarting server...')
    serverProcess.kill()
  }

  // Start new server process
  serverProcess = spawn('node', ['dist/server/server.js'], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development' },
  })

  serverProcess.on('error', (error: Error) => {
    console.error('❌ Server error:', error)
  })
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n[Dev] Shutting down...')
  if (serverProcess) {
    serverProcess.kill()
  }
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('\n[Dev] Shutting down...')
  if (serverProcess) {
    serverProcess.kill()
  }
  process.exit(0)
})
