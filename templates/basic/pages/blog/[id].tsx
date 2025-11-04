import React from 'react'
import { useParams, Link } from 'react-router-dom'

// Mock blog posts data
const BLOG_POSTS: Record<
  string,
  { title: string; content: string; author: string; date: string }
> = {
  '1': {
    title: 'Getting Started with React 19',
    author: 'React Team',
    date: '2024-12-01',
    content: `
      React 19 brings exciting new features including the use() Hook for data fetching,
      improved Server Components, and better streaming SSR support.

      The new use() Hook allows you to read the value of a resource like a Promise or Context.
      Unlike useEffect, you can call use() inside conditionals and loops, making data fetching
      more flexible than ever before.
    `,
  },
  '2': {
    title: 'Building a File-System Router',
    author: 'Framework Team',
    date: '2024-12-05',
    content: `
      File-system based routing provides a convention-over-configuration approach to
      defining routes in your application. Simply create a file in the pages/ directory,
      and it automatically becomes a route!

      Dynamic routes are supported using the [param] syntax.
    `,
  },
}

export default function BlogPostPage() {
  const { id } = useParams<{ id: string }>()
  const post = BLOG_POSTS[id || '1']

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Post Not Found</h1>
            <p className="text-gray-600 mb-6">
              The blog post with ID "{id}" doesn't exist.
            </p>
            <Link
              to="/"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <article className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
            <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
            <div className="flex items-center space-x-4 text-sm opacity-90">
              <span>By {post.author}</span>
              <span>•</span>
              <span>{new Date(post.date).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="p-8 md:p-12">
            <div className="prose prose-lg max-w-none">
              {post.content.split('\n\n').map((paragraph, index) => (
                <p key={index} className="text-gray-700 leading-relaxed mb-4">
                  {paragraph.trim()}
                </p>
              ))}
            </div>

            <div className="mt-8">
              <Link
                to="/"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </article>
    </div>
  )
}
