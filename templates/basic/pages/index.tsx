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
            A modern React Server-Side Rendering framework with streaming support
          </p>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <p className="text-sm text-blue-700 font-semibold mb-2">
              Framework Features:
            </p>
            <ul className="list-disc list-inside text-sm text-blue-600 space-y-1">
              <li>✅ Server-Side Rendering (SSR)</li>
              <li>✅ Client-Side Hydration</li>
              <li>✅ File-system routing</li>
              <li>✅ React Router v6 integration</li>
              <li>✅ Streaming SSR with Suspense</li>
              <li>✅ Data fetching with use() Hook</li>
              <li>✅ HMR & React Fast Refresh</li>
            </ul>
          </div>

          <div className="border-t pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Explore Framework Features 🚀
            </h2>
            <p className="text-gray-600 mb-6">
              Navigate between pages to see React 19 SSR in action!
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <Link
                to="/about"
                className="block p-6 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg shadow-lg transition-all transform hover:scale-105"
              >
                <h3 className="text-xl font-bold mb-2">About Page</h3>
                <p className="text-sm opacity-90">Learn more about the framework</p>
              </Link>

              <Link
                to="/blog/1"
                className="block p-6 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white rounded-lg shadow-lg transition-all transform hover:scale-105"
              >
                <h3 className="text-xl font-bold mb-2">Blog Post</h3>
                <p className="text-sm opacity-90">Dynamic route example</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
