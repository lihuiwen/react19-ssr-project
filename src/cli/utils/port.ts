import net from 'net'

/**
 * Check if a port is available
 * @param port Port number to check
 * @param host Host to bind to (default: '0.0.0.0')
 * @returns true if port is available, false otherwise
 */
export async function checkPort(
  port: number,
  host: string = '0.0.0.0'
): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer()

    server.once('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false) // Port is in use
      } else {
        resolve(false) // Other errors
      }
    })

    server.once('listening', () => {
      server.close()
      resolve(true) // Port is available
    })

    server.listen(port, host)
  })
}

/**
 * Find an available port starting from a given port
 * @param startPort Port to start searching from
 * @param maxAttempts Maximum number of ports to try
 * @returns Available port number or null if none found
 */
export async function findAvailablePort(
  startPort: number,
  maxAttempts: number = 10
): Promise<number | null> {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i
    const available = await checkPort(port)
    if (available) {
      return port
    }
  }
  return null
}
