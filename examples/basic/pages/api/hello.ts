/**
 * Simple API example
 * GET /api/hello
 */

import type { Context } from 'koa'

export default async function handler(ctx: Context) {
  ctx.body = {
    message: 'Hello from API!',
    timestamp: new Date().toISOString(),
    method: ctx.method,
  }
}
