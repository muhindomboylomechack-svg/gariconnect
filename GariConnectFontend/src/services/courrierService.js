// Import de l'instance API centralisée
import api from './api';

export const courrierService = {
    // Cette fonction appelle l'endpoint @PutMapping("/{id}/statut")
    updateStatut: async (id, statut) => {
        // CORRECTION : Suppression de "/agences" pour correspondre au @RequestMapping("/api/courriers") du Backend
        // On passe le statut en paramètre de requête (?statut=...) comme défini dans votre Java
        // L'instance 'api' gère automatiquement l'URL de base et le token d'authentification
        const response = await api.put(`/courriers/${id}/statut?statut=${statut}`, {});
        return response.data;
    },

    // Optionnel : pour récupérer la liste des colis de l'agence
    getMesCourriers: async () => {
        // CORRECTION : Remplacement de '/agences/courriers' par '/courriers' pour cibler la méthode getAllCourriers() du Backend
        const response = await api.get('/courriers');
        return response.data;
    }
};