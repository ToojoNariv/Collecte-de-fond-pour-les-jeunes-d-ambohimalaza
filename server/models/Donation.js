const mongoose = require('mongoose');

const DonationSchema = new mongoose.Schema(
    {
        nom: {
            type: String,
            required: [true, 'Le nom est obligatoire'],
            trim: true
        },
        prenom: {
            type: String,
            required: [true, 'Le prénom est obligatoire'],
            trim: true
        },
        contact: {
            type: String,
            required: [true, 'Le contact ou numéro est obligatoire'],
            trim: true
        },
        somme: {
            type: Number,
            required: [true, 'La somme est obligatoire'],
            min: [0, 'La somme doit être positive']
        },
        remarque: {
            type: String,
            trim: true,
            default: ''
        },
        date: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

// Index pour accélérer la recherche textuelle
DonationSchema.index({ nom: 'text', prenom: 'text', contact: 'text' });

module.exports = mongoose.model('Donation', DonationSchema, 'collectes_fond');

