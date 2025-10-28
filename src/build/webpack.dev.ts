/**
 * Webpack Development Configuration with HMR
 * Extends client configuration with Hot Module Replacement support
 */

import path from 'path'
import webpack, { type Configuration } from 'webpack'
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin'
import ReactRefreshTypeScript from 'react-refresh-typescript'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import { WebpackManifestPlugin } from 'webpack-manifest-plugin'
import {
  ROOT_DIR,
  DIST_DIR,
  EXAMPLES_DIR,
  createCssLoaders,
} from './webpack.common'

const HMR_PORT = process.env.HMR_PORT || 3001

const devConfig: Configuration = {
  name: 'client',
  target: 'web',
  mode: 'development',
  devtool: 'cheap-module-source-map',

  entry: {
    client: [
      // HMR client connection - must use full URL for cross-port connection
      `webpack-hot-middleware/client?path=http://localhost:${HMR_PORT}/__webpack_hmr&reload=true&timeout=20000&overlay=true`,
      path.resolve(EXAMPLES_DIR, 'client.tsx'),
    ],
  },

  output: {
    path: path.resolve(DIST_DIR, 'client'),
    filename: '[name].js',
    chunkFilename: '[name].chunk.js',
    publicPath: '/',
    clean: true,
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: {
      '@': path.resolve(ROOT_DIR, 'src'),
    },
  },

  module: {
    rules: [
      // TypeScript files with React Fast Refresh
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: path.resolve(ROOT_DIR, 'tsconfig.client.json'),
              transpileOnly: true, // Speed up compilation in dev mode
              getCustomTransformers: () => ({
                before: [ReactRefreshTypeScript()],
              }),
            },
          },
        ],
      },

      // CSS files
      ...createCssLoaders(false),
    ],
  },

  plugins: [
    // Hot Module Replacement plugin
    new webpack.HotModuleReplacementPlugin(),

    // React Fast Refresh plugin
    // Note: overlay is disabled because we're using webpack-hot-middleware instead of webpack-dev-server
    new ReactRefreshWebpackPlugin({
      overlay: false,
    }),

    // Extract CSS into separate files
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),

    // Generate manifest.json for asset mapping
    new WebpackManifestPlugin({
      fileName: 'manifest.json',
      publicPath: '/',
    }) as any,

    // Define environment variables
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development'),
      'process.env.RUNTIME': JSON.stringify('client'),
      __IS_SERVER__: JSON.stringify(false),
      __DEV__: JSON.stringify(true),
    }),
  ],

  optimization: {
    // Disable optimization in development for faster builds
    minimize: false,
    splitChunks: false,
  },

  // Enable better error messages
  stats: {
    colors: true,
    modules: false,
    children: false,
    chunks: false,
    chunkModules: false,
  },
}

export default devConfig
