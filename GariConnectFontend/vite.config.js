import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
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