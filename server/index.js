const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./db');
const Donation = require('./models/Donation');
const Remarque = require('./models/Remarque');

const app = express();
const PORT = process.env.PORT || 5000;

// Connexion à MongoDB
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());

// Assurer la connexion MongoDB pour chaque requête API (idéal pour Vercel Serverless)
app.use(async (req, res, next) => {
    if (req.path.startsWith('/api')) {
        await connectDB();
    }
    next();
});

// Identifiants administrateur (lus strictement depuis le fichier .env)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
    console.warn('⚠️ Attention: ADMIN_USERNAME ou ADMIN_PASSWORD n\'est pas défini dans le fichier .env');
}

// ---------------------- ROUTES API ---------------------- //

// 1. Authentification pour la saisie (/neny-mampiditra-saisi)
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: 'Veuillez saisir le nom d\'utilisateur et le mot de passe.'
        });
    }

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        return res.json({
            success: true,
            message: 'Connexion réussie',
            user: {
                username: ADMIN_USERNAME,
                role: 'admin'
            },
            // Token de session basique pour le frontend
            token: Buffer.from(`${ADMIN_USERNAME}:${Date.now()}`).toString('base64')
        });
    }

    return res.status(401).json({
        success: false,
        message: 'Nom d\'utilisateur ou mot de passe incorrect.'
    });
});

// 2. Liste des dons / recherche en temps réel
app.get('/api/donations', async (req, res) => {
    try {
        const { q } = req.query;
        let filter = {};

        if (q && q.trim() !== '') {
            const raw = q.trim();
            const parts = raw.split('%').filter(Boolean);

            let regex;
            if (parts.length === 0) {
                regex = new RegExp('.*', 'i');
            } else {
                const regexStr = parts.map(p => {
                    // Si p est 'd' ou contient des chiffres, supporter recherche flexible
                    if (/^\d+$/.test(p)) {
                        return p.split('').join('\\s*');
                    }
                    if (p.toLowerCase() === 'd') {
                        // Supporte soit la lettre 'd' soit un chiffre
                        return '[d0-9]';
                    }
                    return p.replace(/[-[\]{}()+?.,\\^$|#\s]/g, '\\$&');
                }).join('.*');
                regex = new RegExp(regexStr, 'i');
            }

            filter = {
                $or: [
                    { nom: { $regex: regex } },
                    { prenom: { $regex: regex } },
                    { contact: { $regex: regex } }
                ]
            };
        }

        const donations = await Donation.find(filter).sort({ createdAt: -1 });

        // Calcul des totaux globaux
        const allDonations = await Donation.find();
        const totalSomme = allDonations.reduce((acc, curr) => acc + (Number(curr.somme) || 0), 0);
        const totalCount = allDonations.length;

        res.json({
            success: true,
            data: donations,
            totalSomme,
            totalCount
        });
    } catch (err) {
        console.error('Erreur GET /api/donations:', err);
        res.status(500).json({ success: false, message: 'Erreur serveur lors de la récupération des dons.' });
    }
});

// 3. Enregistrer une nouvelle contribution
app.post('/api/donations', async (req, res) => {
    try {
        const { nom, prenom, contact, somme, remarque } = req.body;

        if (!nom || !contact || somme === undefined || somme === null) {
            return res.status(400).json({
                success: false,
                message: 'Veuillez renseigner Nom, Contact et Somme.'
            });
        }

        const numericSomme = Number(somme);
        if (isNaN(numericSomme) || numericSomme < 0) {
            return res.status(400).json({
                success: false,
                message: 'La somme doit être un nombre positif valide.'
            });
        }

        const newDonation = new Donation({
            nom: nom.trim(),
            prenom: prenom ? prenom.trim() : '',
            contact: contact.trim(),
            somme: numericSomme,
            remarque: remarque ? remarque.trim() : ''
        });

        const saved = await newDonation.save();

        res.status(201).json({
            success: true,
            message: 'Don enregistré avec succès',
            data: saved
        });
    } catch (err) {
        console.error('Erreur POST /api/donations:', err);
        res.status(500).json({ success: false, message: err.message || 'Erreur lors de l\'enregistrement.' });
    }
});

// 4. Modifier une contribution
app.put('/api/donations/:id', async (req, res) => {
    try {
        const { nom, prenom, contact, somme, remarque } = req.body;
        const updated = await Donation.findByIdAndUpdate(
            req.params.id,
            {
                ...(nom && { nom: nom.trim() }),
                ...(prenom !== undefined && { prenom: prenom ? prenom.trim() : '' }),
                ...(contact && { contact: contact.trim() }),
                ...(somme !== undefined && { somme: Number(somme) }),
                ...(remarque !== undefined && { remarque: remarque.trim() })
            },
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Don non trouvé.' });
        }

        res.json({ success: true, message: 'Don mis à jour avec succès', data: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 5. Supprimer une contribution
app.delete('/api/donations/:id', async (req, res) => {
    try {
        const deleted = await Donation.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Don non trouvé.' });
        }
        res.json({ success: true, message: 'Don supprimé avec succès' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ---------------------- ROUTES REMARQUES ---------------------- //

// Récupérer toutes les remarques
app.get('/api/remarques', async (req, res) => {
    try {
        const remarques = await Remarque.find().sort({ ordre: 1, createdAt: 1 });
        res.json({ success: true, data: remarques });
    } catch (err) {
        console.error('Erreur GET /api/remarques:', err);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des remarques.' });
    }
});

// Ajouter une remarque (multilingue)
app.post('/api/remarques', async (req, res) => {
    try {
        const { texte_fr, texte_en, texte_mg, ordre } = req.body;
        const newRemarque = new Remarque({
            texte_fr: texte_fr ? texte_fr.trim() : '',
            texte_en: texte_en ? texte_en.trim() : '',
            texte_mg: texte_mg ? texte_mg.trim() : '',
            ordre: ordre !== undefined ? Number(ordre) : 0
        });
        const saved = await newRemarque.save();
        res.status(201).json({ success: true, data: saved });
    } catch (err) {
        console.error('Erreur POST /api/remarques:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// Modifier une remarque
app.put('/api/remarques/:id', async (req, res) => {
    try {
        const { texte_fr, texte_en, texte_mg, ordre } = req.body;
        const updated = await Remarque.findByIdAndUpdate(
            req.params.id,
            {
                ...(texte_fr !== undefined && { texte_fr: texte_fr.trim() }),
                ...(texte_en !== undefined && { texte_en: texte_en.trim() }),
                ...(texte_mg !== undefined && { texte_mg: texte_mg.trim() }),
                ...(ordre !== undefined && { ordre: Number(ordre) })
            },
            { new: true }
        );
        if (!updated) {
            return res.status(404).json({ success: false, message: 'Remarque non trouvée.' });
        }
        res.json({ success: true, data: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Supprimer une remarque
app.delete('/api/remarques/:id', async (req, res) => {
    try {
        const deleted = await Remarque.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Remarque non trouvée.' });
        }
        res.json({ success: true, message: 'Remarque supprimée avec succès' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// En production, servir l'application Vue compilée
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Fallback SPA pour Vue Router
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
        return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
});

if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`🚀 Serveur backend démarré sur http://localhost:${PORT}`);
    });
}

module.exports = app;
