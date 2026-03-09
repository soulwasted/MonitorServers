import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { lsofApiPlugin } from './vite-plugin-lsof-api.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), lsofApiPlugin()],
  server: {
    host: true, // listen on 0.0.0.0 so that 192.168.x.x:5173 works (not just localhost)
  },
})
