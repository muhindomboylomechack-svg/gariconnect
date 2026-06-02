// Import de l'instance API centralisée pour permettre le basculement d'environnement
import api from './api'; 

const adminService = {
    /**
     * Récupère les données du tableau de bord (Multi-tenant)
     */
    getDashboardStats: async () => {
        try {
            const response = await api.get('/users/dashboard-stats');
            return response.data;
        } catch (error) {
            console.error("Erreur dans getDashboardStats:", error);
            throw error;
        }
    },

    /**
     * Récupère la liste des utilisateurs de l'agence
     */
    getAgencyUsers: async () => {
        try {
            const response = await api.get('/users');
            return response.data;
        } catch (error) {
            console.error("Erreur dans getAgencyUsers:", error);
            throw error;
        }
    },

    /**
     * ALIAS indispensables pour éviter les erreurs "is not a function"
     */
    getUsers: async function() {
        return this.getAgencyUsers();
    },

    /**
     * Crée un collaborateur (Chauffeur, Agent de comptoir, etc.)
     */
    createUser: async (userData) => {
        try {
            const response = await api.post('/users', userData);
            return response.data;
        } catch (error) {
            console.error("Erreur dans createUser:", error);
            throw error;
        }
    },

    /**
     * ALIAS pour correspondre à l'ancienne nomenclature ou aux deux composants
     */
    createCollaborator: async function(userData) {
        return this.createUser(userData);
    },

    /**
     * Active / Valide un chauffeur pour lui permettre de se connecter
     * Route ciblée : PUT /api/users/valider-chauffeur/{id}
     */
    validateUser: async (id) => {
        try {
            const response = await api.put(`/users/valider-chauffeur/${id}`);
            return response.data;
        } catch (error) {
            console.error("Erreur dans validateUser:", error);
            throw error;
        }
    },

    /**
     * ACTION 1 : BLOQUER UN UTILISATEUR
     * Modification logique : Bascule son statut à INACTIF.
     * Route ciblée : PUT /api/users/{id}/bloquer
     */
    blockUser: async (id) => {
        try {
            const response = await api.put(`/users/${id}/bloquer`);
            return response.data;
        } catch (error) {
            console.error("Erreur dans blockUser:", error);
            throw error;
        }
    },

    /**
     * ACTION 2 : SUPPRIMER UN UTILISATEUR
     * Modification physique : Supprime définitivement la ligne de la base de données.
     * Route ciblée : DELETE /api/users/{id}
     */
    deleteUser: async (id) => {
        try {
            const response = await api.delete(`/users/${id}`);
            return response.data;
        } catch (error) {
            console.error("Erreur dans deleteUser:", error);
            throw error;
        }
    },

    /**
     * ALIAS pour sécuriser les appels faits via deleteCollaborator dans d'autres vues UI
     */
    deleteCollaborator: async function(id) {
        return this.deleteUser(id);
    },

    /**
     * Active officiellement une agence entière (Action réservée au SUPER_ADMIN)
     */
    validateAgency: async (id) => {
        try {
            const response = await api.put(`/agences/valider/${id}`);
            return response.data;
        } catch (error) {
            console.error("Erreur dans validateAgency:", error);
            throw error;
        }
    }
};

export default adminService;