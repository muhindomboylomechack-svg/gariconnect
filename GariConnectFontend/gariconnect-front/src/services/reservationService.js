import api from './api';

const reservationService = {
  // Créer une nouvelle réservation
  createReservation: async (trajetId, places) => {
    const response = await api.post('/reservations', { trajetId, places });
    return response.data;
  },

  // Récupérer l'historique d'un client
  getMyReservations: async () => {
    const response = await api.get('/reservations/me');
    return response.data;
  }
};

export default reservationService;
