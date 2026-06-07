/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  /** Optional comma-separated allowlist of emails permitted to use the app. */
  readonly VITE_ALLOWED_EMAILS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
