/**
 * Posts API example
 * GET /api/posts - Get all posts
 * POST /api/posts - Create a new post
 */

import type { Context } from 'koa'

// Mock data store
const posts = [
  { id: 1, title: 'First Post', content: 'This is the first post', created: '2025-01-01' },
  { id: 2, title: 'Second Post', content: 'This is the second post', created: '2025-01-02' },
  { id: 3, title: 'Third Post', content: 'This is the third post', created: '2025-01-03' },
]

/**
 * GET /api/posts
 * Returns all posts
 */
export async function GET(ctx: Context) {
  const { page = '1', limit = '10' } = ctx.query

  const pageNum = parseInt(page as string, 10)
  const limitNum = parseInt(limit as string, 10)

  ctx.body = {
    posts,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: posts.length,
    },
  }
}

/**
 * POST /api/posts
 * Creates a new post
 */
export async function POST(ctx: Context) {
  const { title, content } = ctx.request.body as { title?: string; content?: string }

  // Validation
  if (!title || !content) {
    ctx.status = 400
    ctx.body = {
      error: 'Bad Request',
      message: 'Title and content are required',
    }
    return
  }

  // Create new post
  const newPost = {
    id: posts.length + 1,
    title,
    content,
    created: new Date().toISOString(),
  }

  posts.push(newPost)

  ctx.status = 201
  ctx.body = {
    message: 'Post created successfully',
    post: newPost,
  }
}
