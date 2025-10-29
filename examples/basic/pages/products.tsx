/**
 * Products Page - React 19 use() Hook Example (Phase 4)
 * Route: /products
 *
 * Demonstrates:
 * - Data fetching with use() Hook
 * - Suspense boundaries
 * - Error handling with ErrorBoundary
 * - Loading states
 */

import React, { Suspense, use } from 'react'
import { Link } from 'react-router-dom'
import { mockData } from '../../../src/runtime/shared/data-fetching'
import { createCachedResource } from '../../../src/runtime/shared/resource'
import { ErrorBoundary } from '../../../src/runtime/shared/error-boundary'

// Mock product interface
interface Product {
  id: string
  name: string
  price: number
  description: string
  category: string
  inStock: boolean
}

/**
 * Mock API: Fetch products
 * Simulates a slow API response (1 second delay)
 */
function fetchProducts(): Promise<Product[]> {
  return mockData<Product[]>(
    [
      {
        id: '1',
        name: 'React 19 Handbook',
        price: 29.99,
        description: 'Complete guide to React 19 features including use() Hook and Streaming SSR',
        category: 'Books',
        inStock: true,
      },
      {
        id: '2',
        name: 'TypeScript Pro Course',
        price: 49.99,
        description: 'Master TypeScript with real-world examples',
        category: 'Courses',
        inStock: true,
      },
      {
        id: '3',
        name: 'SSR Framework Toolkit',
        price: 19.99,
        description: 'Tools and utilities for building SSR applications',
        category: 'Tools',
        inStock: false,
      },
      {
        id: '4',
        name: 'Web Performance Guide',
        price: 39.99,
        description: 'Optimize your web applications for maximum performance',
        category: 'Books',
        inStock: true,
      },
    ],
    1000 // 1 second delay to simulate network
  )
}

/**
 * Create cached resource for products
 * This ensures the Promise reference is stable across re-renders
 * Cache key: 'products' with 5-minute TTL
 *
 * TODO: Consider extracting cache keys to a centralized enum to prevent conflicts
 * across different pages (e.g., CacheKeys.PRODUCTS_LIST)
 */
const productsResource = createCachedResource(
  'products', // TODO: Replace with enum key to avoid potential conflicts
  fetchProducts,
  { ttl: 5 * 60 * 1000 } // 5 minutes cache
)

/**
 * Products List Component (uses use() Hook)
 *
 * This component will suspend during data fetching.
 * React will show the Suspense fallback until data is ready.
 */
function ProductsList() {
  // React 19 use() Hook - uses cached resource promise
  // This ensures the Promise reference is stable across re-renders
  const products = use(productsResource.promise)

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {products.map((product) => (
        <div
          key={product.id}
          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
        >
          <div className="p-6">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
              <span
                className={`px-2 py-1 text-xs font-semibold rounded ${
                  product.inStock
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {product.inStock ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-3">{product.category}</p>
            <p className="text-gray-700 mb-4">{product.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-blue-600">
                ${product.price.toFixed(2)}
              </span>
              <button
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  product.inStock
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                disabled={!product.inStock}
              >
                {product.inStock ? 'Add to Cart' : 'Out of Stock'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Loading Skeleton
 *
 * Shown while data is being fetched (Suspense fallback)
 */
function ProductsLoadingSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>
          <div className="flex justify-between items-center">
            <div className="h-8 bg-gray-200 rounded w-20"></div>
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Main Products Page Component
 */
export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Products</h1>
          <p className="text-xl text-gray-600">
            Demonstrating React 19's <code className="bg-gray-200 px-2 py-1 rounded">use()</code> Hook
            with Suspense
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8">
          <h3 className="font-semibold text-blue-900 mb-2">Phase 4 Features:</h3>
          <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
            <li>
              <strong>use() Hook</strong>: Fetch data directly in components (suspends rendering)
            </li>
            <li>
              <strong>Suspense Boundaries</strong>: Show loading fallback while data is fetching
            </li>
            <li>
              <strong>Error Boundaries</strong>: Catch and handle data fetching errors gracefully
            </li>
            <li>
              <strong>SSR + Hydration</strong>: Data fetched on server, reused on client (no double fetch)
            </li>
          </ul>
        </div>

        {/* Products Grid with Error Boundary and Suspense */}
        <ErrorBoundary
          fallback={(error, retry) => (
            <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
              <h3 className="text-lg font-bold text-red-900 mb-2">
                Failed to load products
              </h3>
              <p className="text-red-700 mb-4">{error.message}</p>
              <button
                onClick={retry}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                Retry Loading
              </button>
            </div>
          )}
        >
          <Suspense fallback={<ProductsLoadingSkeleton />}>
            <ProductsList />
          </Suspense>
        </ErrorBoundary>

        {/* Technical Details */}
        <div className="mt-12 bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">How It Works</h2>
          <div className="space-y-4 text-gray-700">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">1. Server-Side Rendering</h3>
              <p>
                When you load this page, the server fetches product data using{' '}
                <code className="bg-gray-100 px-1 rounded">use(fetchProducts())</code>. The server
                waits for the promise to resolve, then renders the complete HTML with product data.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">2. Data Serialization</h3>
              <p>
                Fetched data is serialized into{' '}
                <code className="bg-gray-100 px-1 rounded">window.__INITIAL_DATA__.resources</code>{' '}
                and sent to the browser with the HTML.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">3. Client-Side Hydration</h3>
              <p>
                During hydration, React reuses the server-fetched data from{' '}
                <code className="bg-gray-100 px-1 rounded">window.__INITIAL_DATA__</code> instead of
                refetching. This prevents duplicate network requests and ensures instant interactivity.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">4. Client-Side Navigation</h3>
              <p>
                If you navigate to another page and come back, the data will be fetched again (unless
                it's still in cache). This ensures fresh data while avoiding unnecessary requests.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
