import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // The voice agent API runs as a Vercel function in production; locally, `npm run dev:api` serves it.
    proxy: { '/api': 'http://localhost:3001' },
  },
})
