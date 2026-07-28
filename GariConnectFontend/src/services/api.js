import axios from 'axios';

/**
 * 1. Détermination de l'environnement
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
  timeout: 45000, 
});

/**
 * 4. Intercepteur pour le Token JWT (Requêtes sortantes)
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
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
 * 5. Intercepteur pour les Réponses (Sécurité et gestion dynamique des erreurs)
 */
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const responseData = error.response.data || {};
      const errorMessage = (responseData.message || responseData.error || '').toLowerCase();

      // 🛑 1. GESTION DES ERREURS 401 (Session expirée / Non authentifié)
      if (status === 401) {
        console.warn("Session expirée ou non autorisée (401). Nettoyage de la session...");
        
        localStorage.removeItem('token');
        localStorage.removeItem('user'); 

        // Redirection vers le login uniquement si on n'y est pas déjà
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }

      // ⛔ 2. GESTION STRICTE DES ERREURS 403 (Compte explicitement suspendu)
      if (status === 403) {
        // ⚠️ NE PAS REDIRIGER SI ON EST SUR LA PAGE DE LOGIN OU D'INSCRIPTION !
        const isAuthPage = window.location.pathname === '/login' || window.location.pathname === '/register';

        // On ne déclenche l'écran de blocage QUE SI le serveur indique clairement une suspension
        const isSuspendedMessage = errorMessage.includes('suspendu') || 
                                   errorMessage.includes('bloqué') || 
                                   errorMessage.includes('bloque');

        if (!isAuthPage && isSuspendedMessage) {
          console.warn("Compte suspendu confirmé par le serveur (403). Redirection...");

          const localUser = JSON.parse(localStorage.getItem('user') || '{}');
          localUser.statut = 'BLOQUE';
          localStorage.setItem('user', JSON.stringify(localUser));

          localStorage.removeItem('token');

          if (window.location.pathname !== '/compte-bloque') {
            window.location.href = '/compte-bloque';
          }
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;