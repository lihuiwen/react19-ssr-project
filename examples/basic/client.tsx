/**
 * Client Entry Point
 * Hydrates the server-rendered React app
 */

import React from 'react'
import { hydrate, whenReady } from '../../src/runtime/client/hydrate'
import App from './pages/App'
import './styles/global.css'

// Wait for DOM ready, then hydrate
whenReady(() => {
  hydrate({
    App,
  })
})
