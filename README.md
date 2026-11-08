# Collecte de Fond pour les Jeunes d'Ambohimalaza

Application Web complète (Vue.js 3 + PrimeVue + Node.js / Express + MongoDB) pour le suivi et la saisie des contributions et dons.

## 🚀 Fonctionnalités

1. **Tableau des contributions en temps réel** :
   - Réalisé avec PrimeVue `DataTable` et `Column`.
   - Colonnes : **Nom**, **Prénom**, **Contact**, **Somme (en Ar)**.
   - Statistiques globales dynamiques : Total collecté (en Ar).

2. **Barre de recherche instantanée (PrimeVue FloatLabel & InputText)** :
   - Recherche réactive automatique : le tableau se met à jour immédiatement à la frappe.
   - Supporte les recherches partielles, les chiffres/numéros, et les motifs de joker tels que `%nom%`, `%prenom%`, `%034%`, ou `%d%`.

3. **Espace de saisie sécurisé (`/neny-mampiditra-saisi`)** :
   - Protection par authentification administrateur via variables d'environnement (`ADMIN_USERNAME` et `ADMIN_PASSWORD`).
   - Formulaire dédié pour ajouter de nouveaux donateurs : Nom, Prénom, Contact, Somme (Ariary) et remarque optionnelle.
   - Gestion des remarques affichées au bas du tableau avec saisie multilingue (Français, Anglais, Malagasy).

4. **Base de données MongoDB** :
   - Connecté via Mongoose avec chaîne de connexion configurée dans `.env` (`MONGODB_URL`).

---

## 🛠️ Configuration & Démarrage

### 1. Variables d'environnement
Créez un fichier `.env` à la racine du projet (copiez depuis `.env.example`) :
```env
MONGODB_URL=mongodb+srv://<votre_user>:<votre_mdp>@<votre_cluster>.mongodb.net/<votre_db>?retryWrites=true&w=majority
PORT=5000
ADMIN_USERNAME=votre_nom_utilisateur
ADMIN_PASSWORD=votre_mot_de_passe
```

### 2. Démarrer en mode développement (Serveur API + Vite Frontend)
```bash
npm run dev
```
- Frontend Vite : [http://localhost:5173](http://localhost:5173)
- Backend API Express : [http://localhost:5000](http://localhost:5000)

### 3. Démarrer uniquement le backend
```bash
npm run server
```

### 4. Compiler et lancer en mode production
```bash
npm run build
npm start
```
