const mongoose = require('mongoose');

const RemarqueSchema = new mongoose.Schema(
    {
        texte_fr: {
            type: String,
            default: '',
            trim: true
        },
        texte_en: {
            type: String,
            default: '',
            trim: true
        },
        texte_mg: {
            type: String,
            default: '',
            trim: true
        },
        ordre: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Remarque', RemarqueSchema, 'remarques_fond');

