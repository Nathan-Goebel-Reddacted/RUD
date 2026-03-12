import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from "path";
import fs from "fs";

function renameDisplayHtml(): Plugin {
  return {
    name: 'rename-display-html',
    closeBundle() {
      const src  = path.resolve('dist', 'index.display.html')
      const dest = path.resolve('dist', 'index.html')
      if (fs.existsSync(src)) fs.renameSync(src, dest)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isDisplay = mode === 'display' || mode === 'gh-pages'
  const isGHPages = mode === 'gh-pages'
  const base      = isGHPages ? '/RUD/' : '/'

  return {
    base,
    plugins: [
      react(),
      ...(isDisplay ? [
        VitePWA({
          registerType: 'autoUpdate',
          devOptions: { enabled: false },
          manifest: {
            name: 'RUD Display',
            short_name: 'RUD',
            theme_color: '#1a1a2e',
            background_color: '#1a1a2e',
            display: 'fullscreen',
            orientation: 'landscape',
            start_url: isGHPages ? '/RUD/display' : '/display',
            scope:     isGHPages ? '/RUD/'        : '/',
            icons: [
              { src: 'icons/pwa-64x64.png',             sizes: '64x64',   type: 'image/png' },
              { src: 'icons/pwa-192x192.png',            sizes: '192x192', type: 'image/png' },
              { src: 'icons/pwa-512x512.png',            sizes: '512x512', type: 'image/png' },
              { src: 'icons/maskable-icon-512x512.png',  sizes: '512x512', type: 'image/png', purpose: 'maskable' },
            ],
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
            cleanupOutdatedCaches: true,
            navigateFallback: isGHPages ? '/RUD/index.html' : '/index.html',
          },
        }),
        renameDisplayHtml(),
      ] : []),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    ...(isDisplay ? {
      build: {
        rollupOptions: {
          input: path.resolve(__dirname, 'index.display.html'),
        },
      },
    } : {}),
  }
})
