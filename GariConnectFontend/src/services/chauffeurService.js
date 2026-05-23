import api from './api';

const chauffeurService = {
    // Récupérer le trajet assigné aujourd'hui au chauffeur
    getTodayTrajet: async () => {
        const response = await api.get('/chauffeur/mon-trajet');
        return response.data;
    },

    // Valider la présence d'un passager (via le code de son ticket scanné)
    // Synchronisé avec le ReservationController du Backend Spring Boot
    validerPassager: async (codeTicket) => {
        const response = await api.post('/api/reservations/scanner-ticket', { 
            codeTicket: codeTicket 
        });
        return response.data;
    }
};

export default chauffeurService;