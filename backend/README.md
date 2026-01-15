# ChantierPro Backend API

API REST pour la gestion de chantiers de génie électrique.

## 🚀 Installation

```bash
# Cloner le repository
git clone <votre-repo>

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Puis éditer .env avec vos valeurs

# Lancer les migrations
npm run migrate

# Lancer les seeders (données de test)
npm run seed

# Démarrer le serveur en mode développement
npm run dev
```

## 🐳 Docker

```bash
# Démarrer avec Docker Compose
docker-compose up -d

# Voir les logs
docker-compose logs -f backend

# Arrêter
docker-compose down
```

## 📚 Documentation API

Accéder à la documentation Swagger:
```
http://localhost:5000/api/v1/docs
```

## 🧪 Tests

```bash
# Lancer tous les tests
npm test

# Tests en mode watch
npm run test:watch

# Générer le rapport de couverture
npm run test -- --coverage
```

## 📁 Structure du Projet

Voir la documentation dans `/docs/architecture.md`

## 🔐 Sécurité

- JWT pour l'authentification
- Bcrypt pour le hachage des mots de passe
- Helmet pour sécuriser les headers HTTP
- Rate limiting pour prévenir les abus
- Validation des données avec Joi

## 🛠️ Technologies

- Node.js 18+
- Express.js
- MySQL + Sequelize ORM
- JWT + Bcrypt
- Swagger/OpenAPI
- Jest (tests)
- Docker

## 📝 Licence

MIT