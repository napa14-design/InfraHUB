
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      // Removemos includeAssets de imagens que não existem para evitar erros 404
      includeAssets: ['favicon.ico'], 
      manifest: {
        id: 'hydrosys-cloro-app',
        name: 'HydroSys Cloro',
        short_name: 'Cloro',
        description: 'Controle de Cloro e pH',
        theme_color: '#0891b2',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/?mode=cloro', // Garante que abra na rota certa
        scope: '/',
        icons: [
          {
            src: '/pwa-icon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
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
