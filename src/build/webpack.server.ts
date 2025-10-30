/**
 * Webpack Server Configuration
 * Builds the server-side rendering bundle
 */

import path from 'path'
import webpack, { type Configuration } from 'webpack'
import nodeExternals from 'webpack-node-externals'
import {
  ROOT_DIR,
  SRC_DIR,
  DIST_DIR,
  EXAMPLES_DIR,
  createTsLoader,
  commonConfig,
} from './webpack.common'
import { PageComponentsGeneratorPlugin } from './plugins/page-components-generator'

const serverConfig: Configuration = {
  ...commonConfig,

  name: 'server',
  target: 'node',

  entry: {
    server: path.resolve(SRC_DIR, 'cli/server.ts'),
  },

  output: {
    path: path.resolve(DIST_DIR, 'server'),
    filename: '[name].js',
    libraryTarget: 'commonjs2',
    clean: true,
  },

  // Exclude node_modules from server bundle (they'll be available at runtime)
  externals: [
    nodeExternals({
      allowlist: [
        /\.css$/,
        /\.(png|jpg|jpeg|gif|svg|woff|woff2|eot|ttf|otf)$/,
      ],
    }),
  ],

  module: {
    rules: [
      // TypeScript files
      createTsLoader(path.resolve(ROOT_DIR, 'tsconfig.server.json')),

      // CSS files - ignore on server
      {
        test: /\.css$/,
        use: 'null-loader',
      },
    ],
  },

  plugins: [
    // Auto-generate page component mappings from .routes.json
    new PageComponentsGeneratorPlugin({
      routesJsonPath: path.resolve(DIST_DIR, '.routes.json'),
      outputPath: path.resolve(SRC_DIR, 'runtime/server/page-loader.generated.ts'),
      pagesDir: path.resolve(EXAMPLES_DIR, 'pages'),  // EXAMPLES_DIR already includes 'basic'
    }),

    // Define environment variables
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process.env.RUNTIME': JSON.stringify('server'),
      __IS_SERVER__: JSON.stringify(true),
    }),
  ],

  // Node.js polyfills are not needed since we're targeting Node.js
  node: {
    __dirname: false,
    __filename: false,
  },
}

export default serverConfig
