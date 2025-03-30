/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_BASE_PATH?: string;
  readonly TEMPO?: string;
  // Add other environment variables you use here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}