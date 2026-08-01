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
      // 🟢 AJOUT : Force le fonctionnement de la PWA et du Service Worker en environnement LOCAL (npm run dev)
      devOptions: {
        enabled: true,
        type: 'module'
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'GariConnect',
        short_name: 'GariConnect',
        description: 'L\'avenir du transport - Gestion des flottes et réservations',
        theme_color: '#2563eb', // Bleu de votre charte graphique
        background_color: '#ffffff',
        display: 'standalone', // Cache la barre d'adresse pour faire comme une vraie application
        orientation: 'portrait', // 🟢 Force l'affichage vertical sur mobile (optionnel mais recommandé)
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any' // 🟢 Icône normale avec fond transparent
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable' // 🟢 Requis par Android pour générer la WebAPK sans le badge Google
          }
        ]
      }
    })
  ],
  server: {
    host: true, // Autorise les connexions externes
    port: 5173,
    strictPort: true,
    // Ajout d'une option pour forcer le rafraîchissement en cas de bug
    watch: {
      usePolling: true,
    },
  },
  resolve: {
    // Aide Vite à trouver tes fichiers .jsx sans confusion
    extensions: ['.js', '.jsx', '.json']
  }
})