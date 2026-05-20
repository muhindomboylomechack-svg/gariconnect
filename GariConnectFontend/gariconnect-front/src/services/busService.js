import api from './api';

const busService = {
    // Récupérer tous les bus de l'agence connectée
    getAllBus: async () => {
        try {
            const response = await api.get('/vehicules');
            return response.data;
        } catch (error) {
            throw error.response?.data || "Erreur lors de la récupération des bus";
        }
    },

    // Ajouter un nouveau bus
    createBus: async (busData) => {
        try {
            const response = await api.post('/vehicules', busData);
            return response.data;
        } catch (error) {
            throw error.response?.data || "Erreur lors de la création du bus";
        }
    },

    // Mettre à jour un bus
    updateBus: async (id, busData) => {
        try {
            const response = await api.put(`/vehicules/${id}`, busData);
            return response.data;
        } catch (error) {
            throw error.response?.data || "Erreur lors de la modification";
        }
    },

    // Supprimer un bus
    deleteBus: async (id) => {
        try {
            const response = await api.delete(`/vehicules/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || "Erreur lors de la suppression";
        }
    }
};

export default busService;