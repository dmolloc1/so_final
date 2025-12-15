interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_ENVIRONMENT: 'development' | 'production'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}