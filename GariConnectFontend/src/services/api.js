import axios from 'axios';

/**
 * 1. Détermination de l'environnement
 * On vérifie si Vite est en mode production OU si l'URL dans le navigateur 
 * contient "render.com" (ce qui confirme qu'on est en production).
 */
const isProduction = import.meta.env.PROD || window.location.hostname.includes('render.com');

/**
 * 2. Configuration des URLs de base
 */
export const API_URL = isProduction 
  ? 'https://gariconnectbackend.onrender.com' 
  : 'http://localhost:8080';

/**
 * 3. Création de l'instance Axios
 */
const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000, 
});

/**
 * 4. Intercepteur pour le Token JWT (Requêtes sortantes)
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      // Nettoyage robuste du token
      const cleanToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
      config.headers.Authorization = `Bearer ${cleanToken}`;
    }
    
    return config;
  }, 
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * 5. Intercepteur pour les Réponses (Sécurité et déconnexion automatique)
 */
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const status = error.response.status;

      // Si l'erreur est 401 (Non Autorisé / Session expirée / Utilisateur supprimé)
      if (status === 401) {
        console.warn("Session expirée ou compte invalide (Erreur 401). Déconnexion...");
        
        // Nettoyage complet
        localStorage.removeItem('token');
        localStorage.removeItem('user'); 

        // ✅ CORRECTION : Éviter la boucle infinie si on est DÉJÀ sur la page login
        if (window.location.pathname !== '/login') {
            window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;