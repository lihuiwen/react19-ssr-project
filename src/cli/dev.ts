/**
 * Development Script (Phase 5 - HMR)
 * Dual-server architecture with Hot Module Replacement
 * - HMR Server (Port 3001): Webpack dev server for client code
 * - SSR Server (Port 3000): Koa server for server-side rendering
 */

import { spawn } from 'child_process'
import path from 'path'
import { generateRoutesJSON, watchRoutes } from '../build/route-scanner'

console.log('🔧 Starting development mode with HMR...\n')

// Generate routes.json before starting servers
// Note: page-loader.ts now uses Webpack require.context (no generation needed)
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

// Watch routes for changes and regenerate routes.json
watchRoutes(pagesDir, routesOutput, () => {
  console.log('🔄 Routes updated, regenerating routes.json...')
})

// Start the dual-server development environment
const devScriptPath = path.resolve(__dirname, '../../scripts/dev.js')

console.log('🚀 Starting dual-server development environment...\n')

const devProcess = spawn('node', [devScriptPath], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NODE_ENV: 'development',
  },
})

devProcess.on('error', (error: Error) => {
  console.error('❌ Development environment error:', error)
  process.exit(1)
})

devProcess.on('exit', (code: number | null) => {
  if (code !== 0) {
    console.error(`❌ Development environment exited with code ${code}`)
    process.exit(code || 1)
  }
})

// Graceful shutdown
function shutdown() {
  console.log('\n👋 Shutting down development environment...')
  if (devProcess) {
    devProcess.kill('SIGTERM')
  }
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
