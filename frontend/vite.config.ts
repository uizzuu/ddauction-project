import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
   plugins: [react()],
   base: "/",
   server: {
     port: 3000,
     proxy: {
       '/api': {
         target: 'http://localhost:8080', // 로컬 개발 백엔드
         changeOrigin: true
       }
     }
   }
 })
