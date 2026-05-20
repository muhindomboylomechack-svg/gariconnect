import axios from 'axios';

// Ajustez l'URL de base selon votre configuration
const API_URL = 'http://localhost:8080/api/notifications'; 

/**
 * Fonction helper privée pour récupérer le token et générer l'en-tête d'autorisation
 */
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };
};

export const notificationService = {
    
    // 1. Récupérer toutes les notifications de l'utilisateur connecté
    getMesNotifications: async () => {
        const response = await axios.get(`${API_URL}/mes-notifications`, getAuthHeader());
        return response.data;
    },

    // 2. Marquer une notification spécifique comme lue
    marquerCommeLue: async (id) => {
        // Correction de l'URL pour correspondre aux structures standards de vos contrôleurs
        const response = await axios.put(`${API_URL}/marquer-lue/${id}`, {}, getAuthHeader());
        return response.data;
    },

    // 3. Supprimer une seule notification par son ID
    supprimerNotification: async (id) => {
        const response = await axios.delete(`${API_URL}/${id}`, getAuthHeader());
        return response.data;
    },

    // 4. Balayer/Supprimer toutes les notifications déjà lues
    balayerNotificationsLues: async () => {
        const response = await axios.delete(`${API_URL}/nettoyer-lus`, getAuthHeader());
        return response.data;
    }
};