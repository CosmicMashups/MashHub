import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import compression from 'vite-plugin-compression';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),

    // Generate .gz and .br compressed assets alongside the original files.
    // Servers that support pre-compressed assets (e.g. nginx with gzip_static) will serve
    // these directly, avoiding on-the-fly compression overhead.
    compression({ algorithm: 'gzip', ext: '.gz' }),
    compression({ algorithm: 'brotliCompress', ext: '.br' }),

    // Progressive Web App: service worker + web manifest.
    // StaleWhileRevalidate for CSV data assets; CacheFirst for static JS/CSS.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['vite.svg', 'assets/songs.csv', 'assets/song_sections.csv', 'assets/anime.csv'],
      manifest: {
        name: 'MashHub — Music Matcher & Database',
        short_name: 'MashHub',
        description: 'Anime music mashup matching and project management tool.',
        theme_color: '#3b82f6',
        background_color: '#1e293b',
        display: 'standalone',
        icons: [
          { src: 'vite.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /\.csv$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'csv-assets',
              expiration: { maxEntries: 10, maxAgeSeconds: 7 * 24 * 60 * 60 },
            },
          },
          {
            urlPattern: /\.(js|css|woff2?)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets',
              expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
        ],
      },
    }),
  ],

  // Set base for GitHub Pages (repo name)
  base: '/MashHub/',

  build: {
    // esbuild minifier is faster and produces comparable output to terser
    minify: 'esbuild',
    // Disable sourcemaps in production to reduce bundle size
    sourcemap: false,
    // Split CSS per chunk to avoid one large stylesheet blocking render
    cssCodeSplit: true,

    rollupOptions: {
      output: {
        // Manual chunk splitting to ensure each heavy vendor is loaded on-demand.
        manualChunks: (id) => {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/dexie')) {
            return 'vendor-dexie';
          }
          if (id.includes('node_modules/fuse.js')) {
            return 'vendor-fuse';
          }
          if (id.includes('node_modules/exceljs')) {
            return 'vendor-exceljs';
          }
          if (id.includes('node_modules/@dnd-kit')) {
            return 'vendor-dnd';
          }
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-motion';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-lucide';
          }
        },
      },
    },
  },

  optimizeDeps: {
    // Pre-bundle dexie to avoid double-bundling in dev mode
    include: ['dexie'],
  },
});
