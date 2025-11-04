/**
 * Format utilities for CLI output
 */

/**
 * Format bytes to human-readable size
 * @param bytes Number of bytes
 * @param decimals Number of decimal places (default: 2)
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Format milliseconds to human-readable duration
 * @param ms Duration in milliseconds
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`
  }

  const seconds = ms / 1000

  if (seconds < 60) {
    return `${seconds.toFixed(2)}s`
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  return `${minutes}m ${remainingSeconds}s`
}

/**
 * Pad string to specified length
 * @param str String to pad
 * @param length Target length
 * @param char Padding character (default: space)
 */
export function padEnd(str: string, length: number, char: string = ' '): string {
  return str.padEnd(length, char)
}

/**
 * Truncate string to max length with ellipsis
 * @param str String to truncate
 * @param maxLength Maximum length
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.substring(0, maxLength - 3) + '...'
}
