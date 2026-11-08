const mongoose = require('mongoose');
require('dotenv').config();

let isConnected = false;

async function connectDB() {
    if (isConnected || mongoose.connection.readyState === 1) {
        return;
    }

    const mongoUri = process.env.MONGODB_URL;
    if (!mongoUri) {
        console.error('❌ Erreur: MONGODB_URL non défini dans les variables d\'environnement.');
        return;
    }

    try {
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000
        });
        isConnected = true;
        console.log('✅ Connecté avec succès à MongoDB');
    } catch (err) {
        console.error('❌ Erreur de connexion MongoDB:', err.message);
    }
}

module.exports = connectDB;
