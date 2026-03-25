/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly SUPABASE_URL?: string
  readonly SUPABASE_ANON_KEY?: string
  readonly VAPID_PUBLIC_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
