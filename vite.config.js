import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { mysqlApiPlugin } from './vite-plugin-mysql-api.js'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    mysqlApiPlugin()
  ],
  server: {
    port: 5173,
    host: true
  }
})
