

// Import de l'instance API centralisée
import api from './api';

export const courrierService = {
    // Cette fonction appelle l'endpoint @PutMapping("/{id}/statut")
    updateStatut: async (id, statut) => {
        // On passe le statut en paramètre de requête (?statut=...) comme défini dans votre Java
        // L'instance 'api' gère automatiquement l'URL de base et le token d'authentification
        const response = await api.put(`/agences/courriers/${id}/statut?statut=${statut}`, {});
        return response.data;
    },

    // Optionnel : pour récupérer la liste des colis de l'agence
    getMesCourriers: async () => {
        const response = await api.get('/agences/courriers');
        return response.data;
    }
};