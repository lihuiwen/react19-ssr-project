/**
 * Example App Component (Phase 1)
 * Simple React component to test SSR and hydration
 */

import React, { useState } from 'react'

export default function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-xl p-8">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              🚀 React 19 SSR Framework
            </h1>
            <p className="text-gray-600">
              Server-Side Rendering with Streaming Support
            </p>
          </header>

          <div className="space-y-6">
            {/* Hydration Test */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                ✨ Hydration Test
              </h2>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCount(count - 1)}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  -
                </button>
                <span className="text-2xl font-bold text-gray-900 min-w-[3rem] text-center">
                  {count}
                </span>
                <button
                  onClick={() => setCount(count + 1)}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                >
                  +
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-4">
                If you can click these buttons and see the counter update, hydration is working! 🎉
              </p>
            </div>

            {/* SSR Verification */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                🔍 SSR Verification
              </h2>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>View page source (Ctrl+U / Cmd+Option+U) to see server-rendered HTML</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Check Network tab - HTML should load instantly</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Console should show hydration complete message</span>
                </li>
              </ul>
            </div>

            {/* Framework Info */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                📦 Framework Status
              </h2>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="font-semibold text-gray-700">Phase</dt>
                  <dd className="text-gray-600">Phase 1 - Basic SSR</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-700">React Version</dt>
                  <dd className="text-gray-600">19.0.0</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-700">Rendering</dt>
                  <dd className="text-gray-600">renderToString</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-700">Hydration</dt>
                  <dd className="text-gray-600">hydrateRoot</dd>
                </div>
              </dl>
            </div>
          </div>

          <footer className="mt-8 text-center text-gray-500 text-sm">
            <p>Built with ❤️ using React 19, Koa, and Webpack</p>
          </footer>
        </div>
      </div>
    </div>
  )
}
