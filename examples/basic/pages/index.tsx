import React from 'react'
import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Welcome to React 19 SSR Framework
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Phase 0 ✅ & Phase 1 ✅ & Phase 2 ✅ & Phase 2.5 🚀 Completed
          </p>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <p className="text-sm text-blue-700 font-semibold mb-2">
              Framework Features:
            </p>
            <ul className="list-disc list-inside text-sm text-blue-600 space-y-1">
              <li>✅ Server-Side Rendering (SSR)</li>
              <li>✅ Client-Side Hydration</li>
              <li>✅ File-system routing (Phase 2)</li>
              <li>🚧 API routes (Phase 3)</li>
              <li>🚧 Streaming SSR with Suspense (Phase 4)</li>
              <li>🚧 HMR & React Fast Refresh (Phase 6)</li>
              <li>🚧 Edge runtime compatible</li>
              <li>🚧 Partial Pre-rendering (PPR) (Phase 10.5)</li>
            </ul>
          </div>

          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-8">
            <p className="text-sm text-green-700 font-semibold mb-2">
              Completed Phases:
            </p>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-green-800">Phase 0: Initialization</p>
                <ul className="list-disc list-inside text-sm text-green-600 mt-1 ml-4">
                  <li>Project structure & TypeScript config</li>
                  <li>Security module (CSP nonce, sanitizeJSON)</li>
                  <li>Observability (Server-Timing, Request-ID)</li>
                </ul>
              </div>
              <div>
                <p className="text-sm font-semibold text-green-800">Phase 1: Basic SSR</p>
                <ul className="list-disc list-inside text-sm text-green-600 mt-1 ml-4">
                  <li>renderToString + hydrateRoot</li>
                  <li>Webpack build pipeline</li>
                  <li>Koa server setup</li>
                </ul>
              </div>
              <div>
                <p className="text-sm font-semibold text-green-800">Phase 2: File-System Routing</p>
                <ul className="list-disc list-inside text-sm text-green-600 mt-1 ml-4">
                  <li>Route scanner & path matching</li>
                  <li>Client-side navigation (Link component)</li>
                  <li>Dynamic routes [id].tsx</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Try File-System Routing 🚀
            </h2>
            <p className="text-gray-600 mb-6">
              Navigate between pages without full page reloads using our new routing system!
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <Link
                to="/about"
                className="block p-6 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg shadow-lg transition-all transform hover:scale-105"
              >
                <h3 className="text-xl font-bold mb-2">About Page</h3>
                <p className="text-sm opacity-90">Static route example → /about</p>
              </Link>

              <Link
                to="/blog/1"
                className="block p-6 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white rounded-lg shadow-lg transition-all transform hover:scale-105"
              >
                <h3 className="text-xl font-bold mb-2">Blog Post #1</h3>
                <p className="text-sm opacity-90">Dynamic route example → /blog/[id]</p>
              </Link>

              <Link
                to="/blog/2"
                className="block p-6 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg shadow-lg transition-all transform hover:scale-105"
              >
                <h3 className="text-xl font-bold mb-2">Blog Post #2</h3>
                <p className="text-sm opacity-90">React Router in action</p>
              </Link>

              <Link
                to="/blog/3"
                className="block p-6 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-lg shadow-lg transition-all transform hover:scale-105"
              >
                <h3 className="text-xl font-bold mb-2">Blog Post #3</h3>
                <p className="text-sm opacity-90">Streaming SSR article</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
