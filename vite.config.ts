import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.jpg'],
        manifest: {
          name: 'نظام أنس المحاسبي المطور',
          short_name: 'أنس المحاسبي',
          description: 'النظام المحاسبي المتكامل لإدارة الحسابات والقيود والنشاط المالي دون إنترنت',
          theme_color: '#4f46e5',
          icons: [
            {
              src: 'icon.jpg',
              sizes: '192x192',
              type: 'image/jpeg'
            },
            {
              src: 'icon.jpg',
              sizes: '512x512',
              type: 'image/jpeg'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,jpg,svg}'],
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024 // 10 MB
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
