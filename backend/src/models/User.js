const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: {
        msg: 'Veuillez fournir un email valide',
      },
    },
  },
  passwordHash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  firstName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Le prénom ne peut pas être vide',
      },
    },
  },
  lastName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Le nom ne peut pas être vide',
      },
    },
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  role: {
    type: DataTypes.ENUM('WORKER', 'MANAGER', 'BOSS'),
    allowNull: false,
    defaultValue: 'WORKER',
  },
  habilitation: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Certifications électriques (ex: B2V, BR, BC)',
  },
  photoUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true, // Convertit automatiquement en snake_case
  indexes: [
    { fields: ['email'] },
    { fields: ['role'] },
    { fields: ['is_active'] },
  ],
});

// Méthodes d'instance
User.prototype.toJSON = function () {
  const values = { ...this.get() };
  delete values.passwordHash;
  return values;
};

User.prototype.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Méthodes statiques
User.hashPassword = async (password) => {
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
  return await bcrypt.hash(password, saltRounds);
};

// Hook avant création : hasher le mot de passe
User.beforeCreate(async (user) => {
  if (user.passwordHash) {
    user.passwordHash = await User.hashPassword(user.passwordHash);
  }
});

// Hook avant mise à jour : hasher le mot de passe si modifié
User.beforeUpdate(async (user) => {
  if (user.changed('passwordHash')) {
    user.passwordHash = await User.hashPassword(user.passwordHash);
  }
});

module.exports = User;