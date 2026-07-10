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

      // 🟢 AJOUT : Si l'erreur est 403 (Compte bloqué en BDD intercepté par Spring Boot)
      if (status === 403) {
        console.warn("Accès refusé ou utilisateur suspendu (Erreur 403). Activation de l'écran de verrouillage...");

        // On extrait l'utilisateur actuel pour mettre à jour son statut localement
        const localUser = JSON.parse(localStorage.getItem('user') || '{}');
        localUser.statut = 'BLOQUE';
        localStorage.setItem('user', JSON.stringify(localUser));

        // Suppression immédiate du token pour bloquer tout futur appel API
        localStorage.removeItem('token');

        // Redirection forcée vers l'écran d'affichage sécurisé si on n'y est pas déjà
        if (window.location.pathname !== '/compte-bloque') {
          window.location.href = '/compte-bloque';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;