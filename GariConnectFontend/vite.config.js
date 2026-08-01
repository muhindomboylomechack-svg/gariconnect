import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
        type: 'module'
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'GariConnect',
        short_name: 'GariConnect',
        start_url: '/', // 🟢 OBLIGATOIRE : Définit la racine pour générer l'APK native sans logo Google
        description: 'L\'avenir du transport - Gestion des flottes et réservations',
        theme_color: '#2563eb', // Bleu de votre charte graphique
        background_color: '#ffffff',
        display: 'standalone', // Cache la barre d'adresse pour faire comme une vraie application
        orientation: 'portrait', // Force l'affichage vertical sur mobile
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable' // Requis par Android pour générer la WebAPK sans le badge Google
          }
        ]
      }
    })
  ],
  server: {
    host: true, // Autorise les connexions externes
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true,
    },
  },
  resolve: {
    // Aide Vite à trouver tes fichiers .jsx sans confusion
    extensions: ['.js', '.jsx', '.json']
  }
})