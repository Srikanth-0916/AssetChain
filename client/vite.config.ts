import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  // Load env variables so we can use them in config
  const env = loadEnv(mode, process.cwd(), '')

  // Backend URL for the Vite dev server proxy (local machine only)
  // LAN clients bypass this proxy and use the dynamic hostname from network.ts
  const backendUrl = env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3001'

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('lucide-react')) return 'icons';
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) return 'vendor';
            }
          },
        },
      },
    },
    server: {
      port: 5173,
      // Bind to all network interfaces so LAN devices can connect
      host: '0.0.0.0',
      proxy: {
        // Proxy /api and /ws to backend — only used by the dev machine itself
        '/api': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/ws': {
          target: backendUrl.replace('http', 'ws'),
          ws: true,
          changeOrigin: true,
        },
      },
    },
  }
})

