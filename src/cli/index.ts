#!/usr/bin/env node

import { Command } from 'commander'
import { handleError } from './utils/error'

const program = new Command()

// CLI metadata
program
  .name('react19-ssr')
  .description('React 19 SSR Framework CLI')
  .version('0.1.0', '-v, --version', 'Output the version number')

// Dev command
program
  .command('dev')
  .description('Start development server with HMR')
  .option('-p, --port <port>', 'Port number', '3000')
  .option('-H, --host <host>', 'Host name', 'localhost')
  .option('-o, --open', 'Open browser automatically', false)
  .action(async (options) => {
    try {
      const { devCommand } = await import('./commands/dev')
      await devCommand(options)
    } catch (error) {
      handleError(error as Error)
    }
  })

// Build command
program
  .command('build')
  .description('Build for production')
  .option('--analyze', 'Analyze bundle size', false)
  .option('--no-sourcemap', 'Disable source maps')
  .action(async (options) => {
    try {
      const { buildCommand } = await import('./commands/build')
      await buildCommand(options)
    } catch (error) {
      handleError(error as Error)
    }
  })

// Start command
program
  .command('start')
  .description('Start production server')
  .option('-p, --port <port>', 'Port number', '3000')
  .option('-H, --host <host>', 'Host name', '0.0.0.0')
  .action(async (options) => {
    try {
      const { startCommand } = await import('./commands/start')
      await startCommand(options)
    } catch (error) {
      handleError(error as Error)
    }
  })

// Add help text
program.addHelpText(
  'after',
  `
Examples:
  $ react19-ssr dev
  $ react19-ssr dev --port 4000 --open
  $ react19-ssr build --analyze
  $ react19-ssr start --port 3000

Documentation:
  https://github.com/your-org/react19-ssr-framework

Report Issues:
  https://github.com/your-org/react19-ssr-framework/issues
`
)

// Parse command line arguments
program.parse()
