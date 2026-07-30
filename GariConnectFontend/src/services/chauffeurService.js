import api from './api';

const chauffeurService = {
    // Récupérer le trajet assigné aujourd'hui au chauffeur
    getTodayTrajet: async () => {
        const response = await api.get('/chauffeur/mon-trajet');
        return response.data;
    },

    // 🟢 NOUVEAU : Récupérer les informations du ticket SANS le valider (Étape 1 du scan)
    // Assurez-vous d'avoir ce endpoint GET côté Spring Boot
    getTicketInfo: async (codeTicket) => {
        const response = await api.get(`/api/reservations/ticket/${codeTicket}`);
        return response.data;
    },

    // Valider la présence d'un passager et changer son statut (Étape 2 du scan)
    // Synchronisé avec le ReservationController du Backend Spring Boot
    validerPassager: async (codeTicket) => {
        const response = await api.post('/api/reservations/scanner-ticket', { 
            codeTicket: codeTicket 
        });
        return response.data;
    }
};

export default chauffeurService;