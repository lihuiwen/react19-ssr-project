/**
 * Client Entry Point (Phase 2.5 - React Router Integration)
 * Hydrates the server-rendered React app using React Router v6
 */

import React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { hydrate, whenReady } from '../../src/runtime/client/hydrate'
import './styles/global.css'

// Import all page components
// In production, these would be code-split with React.lazy
import HomePage from './pages/index'
import AboutPage from './pages/about'
import BlogPostPage from './pages/blog/[id]'

// Component registry for dynamic loading
const componentRegistry: Record<string, React.ComponentType<any>> = {
  'index.tsx': HomePage,
  'about.tsx': AboutPage,
  'blog/[id].tsx': BlogPostPage,
}

// Wait for DOM ready, then hydrate
whenReady(() => {
  // Get routes from server
  const initialData = (window as any).__INITIAL_DATA__
  const serverRoutes = initialData?.routes || []

  console.log('[Client] Loaded routes from server:', serverRoutes)

  // Convert server routes to client routes with components
  const routes = serverRoutes.map((route: any) => {
    const { filePath, ...rest } = route

    if (!filePath) {
      return rest
    }

    // Load component from registry
    const Component = componentRegistry[filePath]

    if (!Component) {
      console.warn(`[Client] Component not found for ${filePath}`)
      return rest
    }

    return {
      ...rest,
      element: <Component />,
    }
  })

  console.log('[Client] Creating browser router with routes:', routes)

  // Create browser router
  const router = createBrowserRouter(routes)

  // Create App component with RouterProvider
  const App = () => <RouterProvider router={router} />

  // Hydrate the app
  hydrate({ App })
})
