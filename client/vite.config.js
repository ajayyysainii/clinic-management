import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // Must match where the app is hosted. "/" for Vercel root; use "/clinic/" only if the whole app is served under that path (and assets exist there).
  base: '/',
  server: {
    host: true,
    allowedHosts: ['preva.care'],
  },
})
