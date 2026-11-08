const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = process.env.MONGODB_URL;

if (!mongoUri) {
    console.error('❌ Erreur critique : La variable MONGODB_URL n\'est pas définie dans votre fichier .env');
    console.error('👉 Veuillez créer un fichier .env à la racine avec : MONGODB_URL=mongodb+srv://...');
    process.exit(1);
}

async function connectDB() {
    try {
        await mongoose.connect(mongoUri);
        console.log('✅ Connecté avec succès à MongoDB');
    } catch (err) {
        console.error('❌ Erreur de connexion MongoDB:', err.message);
        process.exit(1);
    }
}

module.exports = connectDB;
