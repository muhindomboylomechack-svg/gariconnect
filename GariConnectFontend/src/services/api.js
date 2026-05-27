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
const API_URL = isProduction 
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
 * 4. Intercepteur pour le Token JWT
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

export default api;