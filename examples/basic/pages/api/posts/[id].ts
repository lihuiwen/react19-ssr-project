/**
 * Dynamic API route example
 * GET /api/posts/:id - Get a single post
 * PUT /api/posts/:id - Update a post
 * DELETE /api/posts/:id - Delete a post
 */

import type { Context } from 'koa'

// Mock data
const posts: Record<string, { id: number; title: string; content: string; created: string }> = {
  '1': { id: 1, title: 'First Post', content: 'This is the first post', created: '2025-01-01' },
  '2': { id: 2, title: 'Second Post', content: 'This is the second post', created: '2025-01-02' },
  '3': { id: 3, title: 'Third Post', content: 'This is the third post', created: '2025-01-03' },
}

/**
 * GET /api/posts/:id
 * Returns a single post
 */
export async function GET(ctx: Context) {
  const { id } = ctx.params

  if (!id) {
    ctx.status = 400
    ctx.body = {
      error: 'Bad Request',
      message: 'Post ID is required',
    }
    return
  }

  const post = posts[id]

  if (!post) {
    ctx.status = 404
    ctx.body = {
      error: 'Not Found',
      message: `Post with ID ${id} not found`,
    }
    return
  }

  ctx.body = {
    post,
  }
}

/**
 * PUT /api/posts/:id
 * Updates a post
 */
export async function PUT(ctx: Context) {
  const { id } = ctx.params
  const { title, content } = ctx.request.body as { title?: string; content?: string }

  if (!id) {
    ctx.status = 400
    ctx.body = {
      error: 'Bad Request',
      message: 'Post ID is required',
    }
    return
  }

  const post = posts[id]

  if (!post) {
    ctx.status = 404
    ctx.body = {
      error: 'Not Found',
      message: `Post with ID ${id} not found`,
    }
    return
  }

  // Update post
  if (title) post.title = title
  if (content) post.content = content

  ctx.body = {
    message: 'Post updated successfully',
    post,
  }
}

/**
 * DELETE /api/posts/:id
 * Deletes a post
 */
export async function DELETE(ctx: Context) {
  const { id } = ctx.params

  if (!id) {
    ctx.status = 400
    ctx.body = {
      error: 'Bad Request',
      message: 'Post ID is required',
    }
    return
  }

  const post = posts[id]

  if (!post) {
    ctx.status = 404
    ctx.body = {
      error: 'Not Found',
      message: `Post with ID ${id} not found`,
    }
    return
  }

  // Delete post
  delete posts[id]

  ctx.body = {
    message: `Post ${id} deleted successfully`,
    deletedPost: post,
  }
}
