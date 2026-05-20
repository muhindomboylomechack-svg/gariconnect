import axios from 'axios';

// L'URL correspond au @RequestMapping("/api/agences/courriers") de ton contrôleur
const API_URL = 'http://localhost:8080/api/agences/courriers';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };
};

export const courrierService = {
    // Cette fonction appelle l'endpoint @PutMapping("/{id}/statut")
    updateStatut: async (id, statut) => {
        // On passe le statut en paramètre de requête (?statut=...) comme défini dans ton Java
        const response = await axios.put(
            `${API_URL}/${id}/statut?statut=${statut}`, 
            {}, 
            getAuthHeaders()
        );
        return response.data;
    },

    // Optionnel : pour récupérer la liste des colis de l'agence
    getMesCourriers: async () => {
        const response = await axios.get(API_URL, getAuthHeaders());
        return response.data;
    }
};