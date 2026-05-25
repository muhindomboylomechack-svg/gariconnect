import axios from 'axios';

// 1. Détermination de l'environnement (Mode Production ou Local)
// 'import.meta.env.PROD' est un booléen automatiquement fourni par Vite (vrai sur Render)
const isProd = import.meta.env.PROD;

// 2. Configuration des URLs de base selon l'environnement (Contenu de ton Image 2)
const API_URL = isProd 
  ? 'https://gariconnectbackend.onrender.com'  // URL de ton backend en production sur Render
  : 'http://localhost:8080';                   // URL de ton backend en local sur ton PC

// 3. Création de l'instance Axios
const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000, // Timeout de sécurité pour les micro-coupures de connexion
});

// 4. Intercepteur pour injecter automatiquement le Token JWT dans chaque requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (token && typeof token === 'string') {
      // Nettoyage au cas où le token stocké contiendrait par mégarde le préfixe "Bearer "
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