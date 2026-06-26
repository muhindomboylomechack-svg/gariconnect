import axios from 'axios';

/**
 * 1. Détermination de l'environnement
 * On vérifie si Vite est en mode production OU si l'URL dans le navigateur 
 * contient "render.com" (ce qui confirme qu'on est en production).
 */
const isProduction = import.meta.env.PROD || window.location.hostname.includes('render.com');

/**
 * 2. Configuration des URLs de base
 * - Si isProduction est vrai : On utilise l'URL Render.
 * - Sinon : On utilise localhost pour ton développement local.
 */
export const API_URL = isProduction 
  ? 'https://gariconnectbackend.onrender.com' 
  : 'http://localhost:8080';

/**
 * 3. Création de l'instance Axios
 */
const api = axios.create({
  // baseURL est construite dynamiquement
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
 * 5. ✅ AJOUT : Intercepteur pour les Réponses (Sécurité et déconnexion automatique)
 * Cet intercepteur attrape toutes les erreurs renvoyées par le serveur.
 * Si le serveur renvoie une 401, on nettoie le localStorage et on redirige.
 */
api.interceptors.response.use(
  (response) => {
    // Si la requête réussit, on passe simplement la réponse
    return response;
  },
  (error) => {
    // Si le serveur renvoie une erreur (401, 403, 500, etc.)
    if (error.response) {
      const status = error.response.status;

      // Si l'erreur est 401 (Non Autorisé / Session expirée / Utilisateur supprimé)
      if (status === 401) {
        console.warn("Session expirée ou compte invalide (Erreur 401). Déconnexion automatique...");
        
        // On nettoie le localStorage pour effacer les traces de l'ancienne session
        localStorage.removeItem('token');
        localStorage.removeItem('user'); 

        // Redirection forcée vers la page de connexion
        window.location.href = '/login';
      }
    }

    // On retourne l'erreur pour que les composants (ex: CourriersPage) puissent quand même la gérer si besoin
    return Promise.reject(error);
  }
);

export default api;