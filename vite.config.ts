import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  /** Expõe ao cliente sem prefixo VITE_ (continua público no bundle). OPENAI não entra — chave só no Supabase. */
  envPrefix: ['SUPABASE_', 'VAPID_'],
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3') || id.includes('node_modules/victory')) return 'charts'
          if (id.includes('node_modules/@dnd-kit'))  return 'dnd'
          if (id.includes('node_modules/react-dom')) return 'react-dom'
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-router')) return 'react-vendor'
          if (id.includes('node_modules/zustand'))   return 'state'
        },
      },
    },
  },
})
