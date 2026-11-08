import axios from 'axios';

const API_BASE = '/api';

export const DonationService = {
    // Récupérer la liste des dons avec recherche optionnelle
    async getDonations(searchQuery = '') {
        try {
            const params = {};
            if (searchQuery && searchQuery.trim() !== '') {
                params.q = searchQuery.trim();
            }
            const response = await axios.get(`${API_BASE}/donations`, { params });
            return response.data;
        } catch (error) {
            console.error('Erreur lors du chargement des dons:', error);
            throw error;
        }
    },

    // Compatibilité directe avec le template fourni par l'utilisateur
    async getProductsMini() {
        const res = await this.getDonations();
        return res.data || [];
    },

    // Enregistrer un don
    async createDonation(data) {
        try {
            const response = await axios.post(`${API_BASE}/donations`, data);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement du don:', error);
            throw error;
        }
    },

    // Modifier un don
    async updateDonation(id, data) {
        try {
            const response = await axios.put(`${API_BASE}/donations/${id}`, data);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la modification du don:', error);
            throw error;
        }
    },

    // Supprimer un don
    async deleteDonation(id) {
        try {
            const response = await axios.delete(`${API_BASE}/donations/${id}`);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la suppression du don:', error);
            throw error;
        }
    },

    // Authentification saisie
    async login(username, password) {
        try {
            const response = await axios.post(`${API_BASE}/auth/login`, { username, password });
            return response.data;
        } catch (error) {
            if (error.response && error.response.data) {
                return error.response.data;
            }
            throw error;
        }
    },

    // ----------------- REMARQUES ----------------- //
    async getRemarques() {
        try {
            const response = await axios.get(`${API_BASE}/remarques`);
            return response.data.data || [];
        } catch (error) {
            console.error('Erreur lors du chargement des remarques:', error);
            return [];
        }
    },

    async createRemarque(data) {
        try {
            const response = await axios.post(`${API_BASE}/remarques`, data);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la création de la remarque:', error);
            throw error;
        }
    },

    async updateRemarque(id, data) {
        try {
            const response = await axios.put(`${API_BASE}/remarques/${id}`, data);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la modification de la remarque:', error);
            throw error;
        }
    },

    async deleteRemarque(id) {
        try {
            const response = await axios.delete(`${API_BASE}/remarques/${id}`);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la suppression de la remarque:', error);
            throw error;
        }
    }
};

// Alias pour correspondre au snippet d'exemple de l'utilisateur
export const ProductService = DonationService;

export default DonationService;

