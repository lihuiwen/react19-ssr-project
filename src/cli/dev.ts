/**
 * Development Script (Phase 1 + Phase 2 + Phase 3)
 * Basic development mode - will be enhanced in Phase 6 with HMR
 * Phase 2: Includes route scanning and watching
 * Phase 3: Includes API route scanning and watching
 */

import webpack from 'webpack'
import { spawn } from 'child_process'
import path from 'path'
import clientConfig from '../build/webpack.client'
import serverConfig from '../build/webpack.server'
import { generateRoutesJSON, watchRoutes } from '../build/route-scanner'
import { generateApiRoutesJSON, watchApiRoutes } from '../build/api-scanner'

console.log('🔧 Starting development mode...\n')

// Phase 2: Generate routes.json before building
console.log('📋 Scanning routes...')
const pagesDir = path.resolve(__dirname, '../../examples/basic/pages')
const routesOutput = path.resolve(__dirname, '../../dist/.routes.json')

try {
  generateRoutesJSON(pagesDir, routesOutput)
  console.log('✅ Routes scanned successfully\n')
} catch (error) {
  console.error('❌ Route scanning failed:', error)
  process.exit(1)
}

// Watch routes for changes
watchRoutes(pagesDir, routesOutput, () => {
  console.log('🔄 Routes updated, server will restart on next build...')
})

// Phase 3: Generate api-routes.json before building
console.log('📋 Scanning API routes...')
const apiDir = path.resolve(__dirname, '../../examples/basic/pages/api')
const apiRoutesOutput = path.resolve(__dirname, '../../dist/.api-routes.json')

try {
  generateApiRoutesJSON(apiDir, apiRoutesOutput)
  console.log('✅ API routes scanned successfully\n')
} catch (error) {
  console.error('❌ API route scanning failed:', error)
  process.exit(1)
}

// Watch API routes for changes
watchApiRoutes(apiDir, apiRoutesOutput, () => {
  console.log('🔄 API routes updated, server will restart on next build...')
})

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
