# 🏗️ ChantierPro
## Application Mobile de Gestion de Chantiers (Role-Based)

---

## 📌 Présentation du Projet

**ChantierPro** est une application mobile professionnelle destinée aux auto-entrepreneurs et petites entreprises du bâtiment (notamment en génie électrique).  
Elle permet de **centraliser, sécuriser et simplifier la gestion des chantiers** grâce à une architecture moderne et un contrôle d’accès basé sur les rôles.

L’application est pensée pour répondre aux besoins réels du terrain tout en respectant des standards élevés en matière de **sécurité, traçabilité et expérience utilisateur**.

---

## 🎯 Objectifs

- Centraliser la gestion des chantiers
- Suivre l’avancement des projets en temps réel
- Améliorer la coordination entre équipes
- Assurer une traçabilité complète des tâches, incidents et preuves terrain
- Sécuriser les accès selon les responsabilités de chaque utilisateur

---

## 👥 Rôles & Utilisateurs

L’application repose sur un système **RBAC (Role-Based Access Control)**.

### 👑 Boss (Entrepreneur)
- Créer et gérer les chantiers
- Assigner un manager à un chantier
- Consulter l’avancement global
- Accéder aux rapports et fichiers
- Vision complète de l’activité

### 🧑‍💼 Manager (Chef d’équipe)
- Gérer les chantiers assignés
- Créer et assigner des tâches
- Suivre l’équipe terrain
- Rédiger des rapports
- Remonter les incidents

### 👷 Worker (Ouvrier)
- Consulter ses tâches
- Mettre à jour l’état d’avancement
- Signaler des problèmes
- Ajouter des fichiers terrain

---

## 🔐 Authentification & Sécurité

- Connexion sécurisée (email / mot de passe)
- Authentification JWT (stateless)
- Stockage sécurisé du token (Expo SecureStore)
- Auto-login au redémarrage de l’application
- Déconnexion
- Contrôle d’accès strict selon le rôle (backend + frontend)

⚠️ **Pas d’inscription publique**  
La création des comptes est volontairement contrôlée (création par l’administrateur ou le Boss).

---

## 🏗️ Fonctionnalités Principales

### Gestion des Chantiers (Projects)
- Création de chantiers (Boss)
- Consultation selon le rôle
- Mise à jour des informations
- Mise à jour du statut :
  - `PLANNED`
  - `IN_PROGRESS`
  - `ON_HOLD`
  - `COMPLETED`
- Assignation d’un manager
- Avancement calculé automatiquement à partir des tâches

---

### Gestion des Tâches
- Création et assignation de tâches
- Statuts :
  - `TODO`
  - `IN_PROGRESS`
  - `BLOCKED`
  - `COMPLETED`
- Suivi de l’avancement
- Blocage avec justification en cas de problème

---

### Gestion des Fichiers
- Ajout de fichiers liés à un chantier ou une tâche
- Types :
  - `BEFORE`
  - `AFTER`
  - `ISSUE`
- Preuve d’avancement et traçabilité terrain

---

### Rapports
- Rapports créés par le Manager
- Types :
  - `DAILY`
  - `WEEKLY`
  - `INCIDENT`
- Texte + fichiers associés
- Consultation par le Boss

---

## 🧱 Architecture Technique

### Frontend (Mobile)
- React Native + Expo
- Expo Router
- Zustand (state management)
- Axios (API)
- Expo SecureStore (sécurité)
- Navigation basée sur les rôles

---

### Backend
- Node.js + Express
- PostgreSQL
- Sequelize ORM
- Joi (validation)
- JWT + bcrypt
- Architecture MVC + Services

---

## 🗃️ Modèle de Données (extrait)

### User
id (UUID)
firstName
lastName
email (unique)
passwordHash
role (BOSS | MANAGER | WORKER)
isActive

### Project
id
name
description
address
startDate
endDate
budget
status
progressPercentage
bossId
managerId

### Task
id
title
description
status
priority
progressPercentage
assignedTo
projectId

### File
id
url
type (BEFORE | AFTER | ISSUE)
taskId (nullable)
projectId (nullable)

### Report
id
type (DAILY | WEEKLY | INCIDENT)
content
projectId
createdBy


---

## 🔌 API – Endpoints Principaux

### Authentification
POST /api/auth/login
GET /api/auth/me
POST /api/auth/logout

### Projects
GET /api/projects
GET /api/projects/:id
POST /api/projects
PUT /api/projects/:id
PATCH /api/projects/:id/status
PATCH /api/projects/:id/assign-manager
DELETE /api/projects/:id

### Tasks
POST /api/projects/:projectId/tasks
PUT /api/tasks/:id
PATCH /api/tasks/:id/status


### Files
POST /api/files/upload
GET /api/projects/:projectId/files


### Reports
POST /api/projects/:projectId/reports
GET /api/projects/:projectId/reports

---

📌 *Projet réalisé dans un cadre académique et professionnel*  
👨‍💻 **Auteur** : Mohamed Oolahiane  
🏗️ *ChantierPro – Simplifions la gestion de vos chantiers*