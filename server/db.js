const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = process.env.MONGODB_URL || 'mongodb+srv://tojomanambina_db_user:gSj1WJeO4EdS0s0y@cluster0.urpk6nh.mongodb.net/jammify?retryWrites=true&w=majority&appName=Cluster0';

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

