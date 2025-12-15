import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {

  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 3000,
      watch: {
        usePolling: true,
      },
      host: true, 
      // Proxy para desarrollo: redirige /api a tu backend Django
      proxy: {
        '/api/proxy': {
          target: 'https://api.apis.net.pe/v1',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/proxy/, ''),
        },
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '/api'), // mantiene /api en la ruta
        },
      },
    },
  }
})