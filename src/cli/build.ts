/**
 * Build Script (Phase 1)
 * Builds both client and server bundles
 */

import webpack from 'webpack'
import clientConfig from '../build/webpack.client'
import serverConfig from '../build/webpack.server'

console.log('🏗️  Building React 19 SSR Framework...\n')

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
