/// <reference types="vite/client" />

import 'vue'

declare module 'vue' {
  interface ComponentCustomProperties {
    $toast: {
      success: (msg: string) => void
      error: (msg: string) => void
    }
  }
}

declare module '*.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  // more env variables...
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_SUPABASE_BUCKET_NAME: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
