/**
 * Webpack Common Configuration
 * Shared settings for both client and server builds
 */

import path from 'path'
import type { Configuration, RuleSetRule } from 'webpack'

export const ROOT_DIR = path.resolve(__dirname, '../..')
export const SRC_DIR = path.resolve(ROOT_DIR, 'src')
export const DIST_DIR = path.resolve(ROOT_DIR, 'dist')
export const EXAMPLES_DIR = path.resolve(ROOT_DIR, 'examples/basic')

/**
 * Common TypeScript loader configuration
 */
export const createTsLoader = (configFile: string): RuleSetRule => ({
  test: /\.tsx?$/,
  use: [
    {
      loader: 'ts-loader',
      options: {
        configFile,
        transpileOnly: true, // Speed up compilation
      },
    },
  ],
  exclude: /node_modules/,
})

/**
 * Common CSS loader configuration
 */
export const createCssLoaders = (isServer: boolean): RuleSetRule[] => {
  if (isServer) {
    // Server-side: ignore CSS imports
    return [
      {
        test: /\.css$/,
        use: 'null-loader',
      },
    ]
  }

  // Client-side: extract CSS
  const MiniCssExtractPlugin = require('mini-css-extract-plugin')

  return [
    {
      test: /\.css$/,
      use: [
        MiniCssExtractPlugin.loader,
        'css-loader',
        {
          loader: 'postcss-loader',
          options: {
            postcssOptions: {
              plugins: ['tailwindcss', 'autoprefixer'],
            },
          },
        },
      ],
    },
  ]
}

/**
 * Common configuration
 */
export const commonConfig: Configuration = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',

  // Use cheap-module-source-map in dev (no eval, CSP-safe)
  // Use source-map in production (full source maps)
  devtool: process.env.NODE_ENV === 'production' ? 'source-map' : 'cheap-module-source-map',

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: {
      '@': SRC_DIR,
      '@runtime': path.resolve(SRC_DIR, 'runtime'),
      '@shared': path.resolve(SRC_DIR, 'runtime/shared'),
    },
  },

  module: {
    rules: [
      // Asset modules for images, fonts, etc.
      {
        test: /\.(png|jpg|jpeg|gif|svg|woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
      },
    ],
  },

  stats: {
    colors: true,
    modules: false,
    children: false,
  },
}

export default commonConfig
