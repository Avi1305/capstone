import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server:{
    host: "0.0.0.0",
    allowedHosts: true,
    port:5173,
    hmr:false,
    watch: {
    usePolling: true,
    interval: 100,
    ignored:['node_modules']
  }
  }
  
})