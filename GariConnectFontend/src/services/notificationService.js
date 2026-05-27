// Import de l'instance API centralisée
import api from './api';

export const notificationService = {
    
    // 1. Récupérer toutes les notifications de l'utilisateur connecté
    getMesNotifications: async () => {
        const response = await api.get('/notifications/mes-notifications');
        return response.data;
    },

    // 2. Marquer une notification spécifique comme lue
    marquerCommeLue: async (id) => {
        const response = await api.put(`/notifications/marquer-lue/${id}`, {});
        return response.data;
    },

    // 3. Supprimer une seule notification par son ID
    supprimerNotification: async (id) => {
        const response = await api.delete(`/notifications/${id}`);
        return response.data;
    },

    // 4. Balayer/Supprimer toutes les notifications déjà lues
    balayerNotificationsLues: async () => {
        const response = await api.delete('/notifications/nettoyer-lus');
        return response.data;
    }
};