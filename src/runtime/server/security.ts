import crypto from 'crypto'

/**
 * 生成请求级 CSP nonce (16 字节 base64)
 * 每次请求都会生成不同的 nonce，防止 XSS 攻击
 */
export function generateNonce(): string {
  return crypto.randomBytes(16).toString('base64')
}

/**
 * 统一脚本注入（强制使用 nonce）
 * ❌ 禁止直接写 <script> 标签
 * ✅ 必须使用此函数注入脚本
 *
 * @param content - 脚本内容（如果使用 src，则为空字符串）
 * @param options - 注入选项（必须包含 nonce）
 * @returns 带 nonce 的 <script> 标签
 */
export function injectScript(
  content: string,
  options: {
    nonce: string
    type?: 'module' | 'text/javascript'
    async?: boolean
    src?: string  // 外部脚本 URL
  }
): string {
  const { nonce, type = 'module', async = false, src } = options

  // 外部脚本引用
  if (src) {
    return `<script type="${type}" nonce="${nonce}" src="${src}"${async ? ' async' : ''}></script>`
  }

  // 内联脚本
  return `<script type="${type}" nonce="${nonce}"${async ? ' async' : ''}>
${content}
</script>`
}

/**
 * 防 XSS 的 JSON 序列化
 * 转义 <、>、& 字符，防止 </script> 注入攻击
 *
 * @param data - 要序列化的数据
 * @returns 安全的 JSON 字符串
 */
export function sanitizeJSON(data: any): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')       // 防止 </script>
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')  // 防止 Line Separator
    .replace(/\u2029/g, '\\u2029')  // 防止 Paragraph Separator
}
