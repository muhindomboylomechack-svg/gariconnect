import axios from 'axios';

// 1. Configuration hybride Local / Production
// Si l'application est sur Render, elle utilise VITE_API_BASE_URL.
// Si elle est sur ton PC en local, elle bascule automatiquement sur localhost:8080.
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const api = axios.create({
  // On ajoute '/api' dynamiquement à l'URL choisie ci-dessus
  baseURL: `${API_URL}/api`,
  
  // Timeout pour éviter les requêtes infinies en cas de micro-coupure à Beni
  timeout: 10000, 
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  
  // Sécurité : On vérifie que le token existe et est bien une chaîne de caractères
  if (token && typeof token === 'string') {
    // Nettoyage au cas où le token stocké contient déjà "Bearer "
    const cleanToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
    config.headers.Authorization = `Bearer ${cleanToken}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;