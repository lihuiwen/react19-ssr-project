declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test'
      PORT?: string
      HOST?: string
      HMR_PORT?: string
    }
  }

  interface Window {
    __INITIAL_DATA__?: any
    __ROUTE_DATA__?: any
  }
}

// Webpack Hot Module Replacement API
interface NodeModule {
  hot?: {
    accept(
      dependencies: string | string[],
      callback?: (updatedDependencies?: any[]) => void,
      errorHandler?: (err: Error) => void
    ): void
    accept(errorHandler?: (err: Error) => void): void
    decline(dependencies?: string | string[]): void
    dispose(callback: (data: any) => void): void
    addDisposeHandler(callback: (data: any) => void): void
    removeDisposeHandler(callback: (data: any) => void): void
    check(autoApply?: boolean): Promise<string[] | null>
    apply(options?: any): Promise<string[] | null>
    status(): string
    status(callback: (status: string) => void): void
    addStatusHandler(callback: (status: string) => void): void
    removeStatusHandler(callback: (status: string) => void): void
    data?: any
  }
}

// Webpack require.context API
interface RequireContext {
  keys(): string[]
  (id: string): any
  <T>(id: string): T
  resolve(id: string): string
  id: string
}

interface NodeRequire {
  context(
    directory: string,
    useSubdirectories?: boolean,
    regExp?: RegExp,
    mode?: 'sync' | 'eager' | 'weak' | 'lazy' | 'lazy-once'
  ): RequireContext
}

export {}
