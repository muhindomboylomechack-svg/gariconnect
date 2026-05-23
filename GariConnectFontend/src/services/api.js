import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
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