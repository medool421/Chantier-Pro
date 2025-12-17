# Cahier des Charges - ChantierPro
## Application Mobile de Gestion de Chantiers

---

## 1. Présentation du Projet

### 1.1 Contexte et Objectif
**ChantierPro** est une application mobile destinée aux auto-entrepreneurs et artisans du bâtiment (électriciens, plombiers, peintres, maçons) pour centraliser et simplifier la gestion quotidienne de leurs chantiers.

### 1.2 Problématiques Résolues
- Difficulté à suivre plusieurs chantiers simultanément
- Gestion manuelle et désorganisée de la documentation
- Communication inefficace avec les clients
- Perte de temps dans les tâches administratives
- Absence de traçabilité des travaux effectués

### 1.3 Cibles Utilisateurs
- **Primaire** : Auto-entrepreneurs du bâtiment
- **Secondaire** : Petites entreprises (2-5 employés)
- **Profils** : Électriciens, plombiers, peintres, menuisiers, architectes d'intérieur

---

## 2. Fonctionnalités Principales

### 2.1 Authentification & Profil
**Inscription/Connexion**
- Inscription : nom, prénom, email, téléphone, mot de passe, métier, nom entreprise
- Connexion sécurisée avec JWT (Access + Refresh tokens)
- Réinitialisation du mot de passe par email
- Gestion du profil utilisateur (modification infos, photo, déconnexion)

### 2.2 Gestion des Chantiers
**Fonctionnalités CRUD complètes** :
- **Créer** : nom, client (nom/tél/email), adresse, type de travaux, description, dates (début/fin), budget estimé, statut, priorité, photos
- **Lire** : liste avec filtres par statut (en attente, en cours, terminé, en pause), recherche, tri par date/priorité
- **Modifier** : toutes les informations du chantier
- **Supprimer** : archivage ou suppression définitive

**Détails d'un chantier** :
- Vue d'ensemble avec progression automatique
- Liste des tâches associées
- Galerie photos (avant/pendant/après)
- Informations client avec actions directes (appel, email, SMS)

### 2.3 Gestion des Tâches
**Fonctionnalités** :
- Création de tâches par chantier : titre, description, dates, priorité, statut, temps estimé
- Liste avec filtres par statut (à faire, en cours, terminée)
- Modification et suppression de tâches
- Changement rapide de statut
- **Bonus** : Chronomètre pour suivi du temps réel (optionnel Phase 2)

### 2.4 Gestion Photos
**Fonctionnalités** :
- Capture photo directement (Expo Camera) ou import galerie (Expo ImagePicker)
- Catégorisation : avant, pendant, après, problèmes
- Ajout de descriptions/notes
- Galerie par chantier (vue grille)
- Zoom, partage et suppression
- Horodatage automatique

### 2.5 Tableau de Bord (Optionnel Phase 2)
- Statistiques rapides : nombre de chantiers actifs, tâches du jour
- Chantiers en retard
- Accès rapides aux actions fréquentes

### 2.6 Notifications Push (Optionnel Phase 2)
- Rappels de tâches à venir
- Alertes chantiers approchant de la date de fin
- Paramétrable dans les réglages

---

## 3. Spécifications Techniques

### 3.1 Stack Technologique

#### Frontend Mobile
- **Framework** : React Native + Expo (SDK 52+)
- **Navigation** : Expo Router ou React Navigation
- **State Management** : Zustand (obligatoire)
- **HTTP Client** : Axios
- **Stockage** : Expo SecureStore (tokens), AsyncStorage (cache)
- **APIs Expo** : Camera, ImagePicker, Notifications

#### Backend
- **Runtime** : Node.js 18+
- **Framework** : Express.js
- **Base de données** : PostgreSQL ou MySQL
- **ORM** : Prisma (recommandé), Sequelize ou TypeORM
- **Authentification** : JWT (jsonwebtoken) + bcrypt
- **Validation** : express-validator ou Joi
- **Documentation** : Swagger/OpenAPI

#### Déploiement
- **Backend** : Railway ou Render (avec HTTPS)
- **Base de données** : PostgreSQL hébergé (Railway/Render)
- **Conteneurisation** : Docker + docker-compose

---

### 3.2 Modèle de Données (Entités)

#### User
```
id, firstName, lastName, email (unique), password (hashed), 
phone, profession, companyName, profilePicture, createdAt, updatedAt
```

#### Project
```
id, userId (FK), name, clientName, clientPhone, clientEmail, 
address, workType, description, startDate, endDate, estimatedBudget, 
status (pending/in_progress/completed/paused), priority, createdAt, updatedAt
```

#### Task
```
id, projectId (FK), title, description, startDate, dueDate, 
status (todo/in_progress/completed), priority, estimatedTime, 
actualTime, createdAt, updatedAt
```

#### Photo
```
id, projectId (FK), taskId (FK nullable), url, 
category (before/during/after/issue), description, takenAt, createdAt
```

**Relations** :
- User → Projects (1:N)
- Project → Tasks (1:N)
- Project → Photos (1:N)

---

### 3.3 Architecture Backend (MVC)

```
backend/
├── src/
│   ├── controllers/     # Logique métier des routes
│   ├── models/          # Modèles de données (ORM)
│   ├── routes/          # Définition des endpoints REST
│   ├── middlewares/     # Auth, validation, erreurs
│   ├── services/        # Services réutilisables
│   ├── utils/           # Fonctions utilitaires
│   └── config/          # Configuration (DB, JWT, etc.)
├── prisma/              # Schéma et migrations (si Prisma)
├── Dockerfile
├── .env.example
└── package.json
```

---

### 3.4 API REST - Endpoints Principaux

#### Authentification
```
POST   /api/auth/register          # Inscription
POST   /api/auth/login             # Connexion (retourne tokens)
POST   /api/auth/refresh-token     # Renouveler access token
POST   /api/auth/forgot-password   # Demande reset password
POST   /api/auth/reset-password    # Reset password avec token
GET    /api/auth/me                # Profil utilisateur (protégé)
PUT    /api/auth/profile           # Modifier profil (protégé)
```

#### Chantiers
```
GET    /api/projects               # Liste (avec query params: status, search)
GET    /api/projects/:id           # Détails
POST   /api/projects               # Créer
PUT    /api/projects/:id           # Modifier
DELETE /api/projects/:id           # Supprimer
```

#### Tâches
```
GET    /api/projects/:projectId/tasks  # Liste par chantier
POST   /api/projects/:projectId/tasks  # Créer
GET    /api/tasks/:id                  # Détails
PUT    /api/tasks/:id                  # Modifier
DELETE /api/tasks/:id                  # Supprimer
PATCH  /api/tasks/:id/status           # Update statut seulement
```

#### Photos
```
GET    /api/projects/:projectId/photos # Liste par chantier
POST   /api/projects/:projectId/photos # Upload (multipart/form-data)
DELETE /api/photos/:id                 # Supprimer
```

**Note** : Toutes les routes (sauf auth) nécessitent le header `Authorization: Bearer {token}`

---

### 3.5 Sécurité

- **Hash passwords** : bcrypt avec 10 salt rounds
- **JWT Tokens** : Access token (30min), Refresh token (7 jours)
- **Middlewares** : Authentification, validation des inputs
- **Protection** : CORS, helmet, rate limiting
- **ORM** : Requêtes préparées contre SQL injection
- **Validation** : express-validator côté backend + React Hook Form côté frontend

---

### 3.6 Stores Zustand (Frontend)

#### authStore
```javascript
{
  user, token, refreshToken, isAuthenticated, isLoading,
  login(), logout(), register(), updateProfile(), refreshAuthToken()
}
```

#### projectStore
```javascript
{
  projects: [], currentProject, isLoading, error,
  fetchProjects(), fetchProjectById(), createProject(), 
  updateProject(), deleteProject()
}
```

#### taskStore
```javascript
{
  tasks: [], isLoading, error,
  fetchTasksByProject(), createTask(), updateTask(), 
  deleteTask(), updateTaskStatus()
}
```

**Persistance** : Utiliser `zustand/middleware` (persist) avec AsyncStorage pour authStore

---

## 4. Écrans Principaux (UI/UX)

### Navigation (Bottom Tabs)
1. **🏠 Accueil** : Dashboard avec stats rapides
2. **🏗️ Chantiers** : Liste et détails
3. **✅ Tâches** : Liste globale des tâches
4. **👤 Profil** : Infos utilisateur et paramètres

### Flow d'Authentification
- **Écran Bienvenue** → Se connecter / S'inscrire
- **Inscription** → Formulaire complet → Validation email
- **Connexion** → Email + Password → Accès app
- **Mot de passe oublié** → Email → Lien reset

### Écrans Chantiers
1. **Liste Chantiers** : Cards avec filtres, recherche, bouton FAB "+"
2. **Créer Chantier** : Formulaire avec tous les champs
3. **Détails Chantier** : Onglets (Infos / Tâches / Photos / Client)
4. **Modifier Chantier** : Formulaire pré-rempli

### Écrans Tâches
1. **Liste Tâches** : Cards avec filtres par statut
2. **Créer Tâche** : Formulaire + sélection chantier
3. **Détails Tâche** : Infos + actions (modifier, supprimer, changer statut)

### Écrans Photos
1. **Galerie** : Vue grille par chantier, filtres par catégorie
2. **Ajouter Photo** : Caméra ou galerie + description + catégorie
3. **Plein écran** : Zoom, partage, suppression

### Écrans Profil
1. **Profil** : Infos + photo + boutons (Modifier, Paramètres, Déconnexion)
2. **Modifier Profil** : Formulaire éditable
3. **Paramètres** : Notifications, changer password, à propos

---

## 5. Design System (Recommandations Figma)

### Palette de Couleurs
- **Primary** : #2563EB (Bleu)
- **Secondary** : #F59E0B (Orange)
- **Success** : #10B981 (Vert)
- **Danger** : #EF4444 (Rouge)
- **Background** : #F9FAFB
- **Text** : #111827 / #6B7280

**Statuts chantiers** :
- En attente : #FCD34D (Jaune)
- En cours : #60A5FA (Bleu)
- Terminé : #34D399 (Vert)
- En pause : #F87171 (Rouge clair)

### Typographie
- **Police** : Inter, SF Pro, Roboto ou système
- **H1** : 28px Bold
- **H2** : 24px SemiBold
- **Body** : 16px Regular
- **Caption** : 12px Regular

### Composants
- **Buttons** : Border radius 8px, padding 12px 24px
- **Cards** : Border radius 12px, shadow légère, padding 16px
- **Inputs** : Border 1px, border radius 8px, padding 12px
- **Badges** : Pill shape (border radius 16px)
- **FAB** : Bouton rond flottant, icône "+", position bottom-right

### Iconographie
- **Librairie** : Lucide Icons ou Heroicons
- **Taille** : 24px standard
- Icônes : building (chantiers), check-square (tâches), camera (photos), user (profil)

---

## 6. Phases de Développement

### Phase 1 - MVP (6 semaines) ✅
**Focus : Fonctionnalités essentielles**
- Authentification (inscription, connexion, profil)
- CRUD Chantiers complet
- CRUD Tâches complet
- Upload et galerie photos
- Navigation fonctionnelle

**Objectif** : Application fonctionnelle avec features de base

### Phase 2 - Améliorations (2 semaines) 🚀
- Dashboard avec statistiques
- Suivi du temps (chronomètre)
- Notifications push
- Optimisations UI/UX
- Tests et corrections bugs

---

## 7. Livrables Attendus

### Documentation
✅ **Ce cahier des charges**
✅ **Diagrammes UML** : Use Case, Classes, Déploiement
✅ **Modélisation BDD** : ERD, schéma SQL avec migrations
✅ **Documentation API** : Swagger/OpenAPI + Collection Postman
✅ **README.md** : Installation, configuration, structure projet, screenshots

### Code Source
✅ **Repository Git** structuré (monorepo ou séparé)
✅ **Backend** : architecture MVC claire
✅ **Frontend** : organisation par features
✅ **Docker** : Dockerfile + docker-compose.yml
✅ **.env.example** : Variables d'environnement documentées

### Application Déployée
✅ **Backend** : URL publique HTTPS (Railway/Render)
✅ **API Docs** : Swagger UI accessible en ligne
✅ **Mobile App** : Testable via Expo Go ou build production
✅ **Database** : PostgreSQL hébergé et accessible

---

## 8. Critères d'Évaluation

- **Architecture** (20%) : Respect patterns MVC, organisation code, qualité structure
- **Modélisation** (15%) : UML pertinents, BDD normalisée (3NF), relations correctes
- **Sécurité** (15%) : JWT, validation, protection routes, hash passwords
- **Fonctionnalités** (25%) : Complétude features, CRUD fonctionnels, qualité UX
- **Documentation** (15%) : Clarté, complétude (UML, API, README)
- **Déploiement** (10%) : Docker fonctionnel, app accessible en production

---

## 9. Planning Indicatif (8 semaines)

**Semaine 1-2** : Setup projet + Authentification + Modélisation
**Semaine 3-4** : CRUD Chantiers + Backend API
**Semaine 5-6** : CRUD Tâches + Photos + Navigation
**Semaine 7** : Dashboard + Notifications + Optimisations
**Semaine 8** : Tests + Docker + Déploiement + Documentation finale

---

**Date de rendu** : 1er février 2026  
**Présentation** : 45 minutes

---

*ChantierPro - Simplifions la gestion de vos chantiers* 🏗️