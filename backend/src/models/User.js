const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const {sequelize} = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },

  firstName: { type: DataTypes.STRING, allowNull: false },
  lastName: { type: DataTypes.STRING, allowNull: false },

  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },

  passwordHash: { type: DataTypes.STRING, allowNull: false },

  phone: { type: DataTypes.STRING },

  role: {
    type: DataTypes.ENUM('BOSS', 'MANAGER', 'WORKER'),
    defaultValue: 'WORKER',
  },

  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  companyId: {
  type: DataTypes.UUID,
  allowNull: true,
},
status: {
  type: DataTypes.ENUM('PENDING', 'ACTIVE'),
  defaultValue: 'ACTIVE',
},
  expoPushToken: { type: DataTypes.STRING, allowNull: true },

}, {
  tableName: 'users',
  timestamps: true,
});

// 🔒 Hash password before create
User.beforeCreate(async (user) => {
  user.passwordHash = await bcrypt.hash(user.passwordHash, 10);
});

// 🔐 Compare password
User.prototype.comparePassword = function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

// Hide sensitive fields
User.prototype.toJSON = function () {
  const values = { ...this.get() };
  delete values.passwordHash;
  return values;
};

module.exports = User;
