/**
 * Build Script (Phase 1 + Phase 2)
 * Builds both client and server bundles
 * Phase 2: Includes route scanning
 */

import webpack from 'webpack'
import path from 'path'
import clientConfig from '../build/webpack.client'
import serverConfig from '../build/webpack.server'
import { generateRoutesJSON } from '../build/route-scanner'

console.log('🏗️  Building React 19 SSR Framework...\n')

// Phase 2: Generate routes.json before building
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

const compiler = webpack([clientConfig, serverConfig])

compiler.run((err, stats) => {
  if (err) {
    console.error('❌ Build failed:', err)
    process.exit(1)
  }

  if (!stats) {
    console.error('❌ No stats available')
    process.exit(1)
  }

  // Print build results
  const info = stats.toJson()

  if (stats.hasErrors()) {
    console.error('\n❌ Build failed with errors:\n')
    info.errors?.forEach((err: any) => {
      console.error(err.message || err)
    })
    process.exit(1)
  }

  console.log(
    stats.toString({
      colors: true,
      modules: false,
      children: false,
      chunks: false,
      chunkModules: false,
    })
  )

  if (stats.hasWarnings()) {
    console.warn('\n⚠️  Build completed with warnings')
  } else {
    console.log('\n✅ Build completed successfully!')
  }

  console.log('\n📦 Output:')
  console.log('   • dist/client/ - Client bundle')
  console.log('   • dist/server/ - Server bundle')
  console.log('\n💡 Run `pnpm start` to start the production server\n')

  compiler.close((closeErr) => {
    if (closeErr) {
      console.error('Error closing compiler:', closeErr)
      process.exit(1)
    }
  })
})
