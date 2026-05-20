import api from './api';

const trajetService = {
    // Récupérer tous les trajets de l'agence
    getAllTrajets: async () => {
        const response = await api.get('/trajets');
        return response.data;
    },

    // Créer un nouveau trajet (lié à un bus et un chauffeur)
    createTrajet: async (trajetData) => {
        const response = await api.post('/trajets', trajetData);
        return response.data;
    },

    // Annuler un trajet
    deleteTrajet: async (id) => {
        const response = await api.delete(`/trajets/${id}`);
        return response.data;
    }
};

export default trajetService;