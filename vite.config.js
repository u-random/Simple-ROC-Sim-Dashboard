import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite build configuration (Edited)
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    open: true // Automatically open browser
  }
})
