/**
 * Production Start Script (Phase 1)
 * Starts the production server
 */

import { startServer } from './server'

// Set production environment
process.env.NODE_ENV = 'production'

console.log('🚀 Starting production server...\n')

startServer()
