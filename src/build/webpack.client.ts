/**
 * Webpack Client Configuration
 * Builds the client-side JavaScript bundle
 */

import path from 'path'
import webpack, { type Configuration } from 'webpack'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import { WebpackManifestPlugin } from 'webpack-manifest-plugin'
import {
  ROOT_DIR,
  DIST_DIR,
  EXAMPLES_DIR,
  createTsLoader,
  createCssLoaders,
  commonConfig,
} from './webpack.common'

const clientConfig: Configuration = {
  ...commonConfig,

  name: 'client',
  target: 'web',

  entry: {
    client: path.resolve(EXAMPLES_DIR, 'client.tsx'),
  },

  output: {
    path: path.resolve(DIST_DIR, 'client'),
    filename: process.env.NODE_ENV === 'production' ? '[name].[contenthash:8].js' : '[name].js',
    chunkFilename:
      process.env.NODE_ENV === 'production' ? '[name].[contenthash:8].js' : '[name].js',
    publicPath: '/',
    clean: true,
  },

  module: {
    rules: [
      // TypeScript files
      createTsLoader(path.resolve(ROOT_DIR, 'tsconfig.client.json')),

      // CSS files
      ...createCssLoaders(false),
    ],
  },

  plugins: [
    // Extract CSS into separate files
    new MiniCssExtractPlugin({
      filename:
        process.env.NODE_ENV === 'production' ? '[name].[contenthash:8].css' : '[name].css',
    }),

    // Generate manifest.json for asset mapping
    new WebpackManifestPlugin({
      fileName: 'manifest.json',
      publicPath: '/',
    }) as any,

    // Define environment variables
    new webpack.DefinePlugin({
      'process.env.RUNTIME': JSON.stringify('client'),
      __IS_SERVER__: JSON.stringify(false),
    }),
  ],

  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
        },
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react',
          priority: 20,
        },
      },
    },
  },
}

export default clientConfig
