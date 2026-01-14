
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'HydroSys Cloro',
        short_name: 'Cloro App',
        description: 'Controle de Cloro e pH',
        theme_color: '#0891b2', // Cyan-600
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        // O TRUQUE ESTÁ AQUI: Definimos um parametro na URL de inicio
        start_url: './?mode=cloro', 
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
