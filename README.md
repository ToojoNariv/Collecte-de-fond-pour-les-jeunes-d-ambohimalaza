# Collecte de Fond pour les Jeunes d'Ambohimalaza

Application Web complète (Vue.js 3 + PrimeVue + Node.js / Express + MongoDB) pour le suivi et la saisie des contributions et dons.

## 🚀 Fonctionnalités

1. **Tableau des contributions en temps réel** :
   - Réalisé avec PrimeVue `DataTable` et `Column`.
   - Colonnes : **Nom**, **Prénom**, **Contact**, **Somme (en Ar)**.
   - Statistiques globales dynamiques : Total collecté (en Ar), Nombre de donateurs, Don moyen.

2. **Barre de recherche instantanée (PrimeVue FloatLabel & InputText)** :
   - Recherche réactive automatique : le tableau se met à jour immédiatement à la frappe.
   - Supporte les recherches partielles, les chiffres/numéros, et les motifs de joker SQL/regex tels que `%nom%`, `%prenom%`, `%034%`, ou `%d%`.

3. **Espace de saisie sécurisé (`/neny-mampiditra-saisi`)** :
   - Protection par authentification :
     - **Nom d'utilisateur** : `Raharindravoavy`
     - **Mot de passe** : `74677647Tojo*`
   - Formulaire dédié pour ajouter de nouveaux donateurs : Nom, Prénom, Contact, Somme (Ariary) et remarque optionnelle.
   - Historique immédiat des saisies avec possibilité de supprimer une erreur.

4. **Base de données MongoDB** :
   - Connecté au cluster MongoDB Atlas `jammify` sur la collection `collectes_fond`.

---

## 🛠️ Démarrage rapide

### 1. Démarrer en mode développement (Serveur API + Vite Frontend)
```bash
npm run dev
```
- Frontend Vite : [http://localhost:5173](http://localhost:5173)
- Backend API Express : [http://localhost:5000](http://localhost:5000)

### 2. Démarrer uniquement le backend
```bash
npm run server
```

### 3. Compiler et lancer en mode production
```bash
npm run build
npm start
```
L'application compilée et l'API seront accessibles directement sur [http://localhost:5000](http://localhost:5000).

---

## 🔐 Identifiants d'accès à la saisie

- **Route** : `/neny-mampiditra-saisi`
- **Nom d'utilisateur** : `Raharindravoavy`
- **Mot de passe** : `74677647Tojo*`

