import api from './api';

const chauffeurService = {
    // Récupérer le trajet assigné aujourd'hui
    getTodayTrajet: async () => {
        const response = await api.get('/chauffeur/mon-trajet');
        return response.data;
    },

    // Valider la présence d'un passager (via son numéro de ticket)
    validerPassager: async (ticketId) => {
        const response = await api.post(`/chauffeur/valider-ticket/${ticketId}`);
        return response.data;
    }
};

export default chauffeurService;