declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test'
      PORT?: string
      HOST?: string
    }
  }

  interface Window {
    __INITIAL_DATA__?: any
    __ROUTE_DATA__?: any
  }
}

export {}
