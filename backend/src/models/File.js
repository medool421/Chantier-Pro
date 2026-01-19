const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const File = sequelize.define('File', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  projectId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'projects',
      key: 'id',
    },
    onDelete: 'CASCADE',
    comment: 'Projet auquel le fichier appartient',
  },
  taskId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'tasks',
      key: 'id',
    },
    onDelete: 'CASCADE',
    comment: 'Tâche à laquelle le fichier appartient',
  },
  uploadedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
    comment: 'Utilisateur qui a uploadé le fichier',
  },
  filename: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Nom original du fichier',
  },
  fileUrl: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: 'URL du fichier (local ou cloud)',
  },
  fileType: {
    type: DataTypes.ENUM('IMAGE', 'PDF', 'DOCUMENT', 'OTHER'),
    allowNull: false,
    defaultValue: 'OTHER',
  },
  mimeType: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Type MIME (image/jpeg, application/pdf, etc.)',
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Taille du fichier en bytes',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Description du fichier (ex: Plan étage 1, Photo avant travaux)',
  },
  category: {
    type: DataTypes.ENUM('PLAN', 'PHOTO', 'REPORT', 'CONTRACT', 'OTHER'),
    allowNull: false,
    defaultValue: 'OTHER',
    comment: 'Catégorie du document',
  },
}, {
  tableName: 'files',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['project_id'] },
    { fields: ['task_id'] },
    { fields: ['uploaded_by'] },
    { fields: ['file_type'] },
    { fields: ['category'] },
    { fields: ['created_at'] },
  ],
  validate: {
    eitherProjectOrTask() {
      if (!this.projectId && !this.taskId) {
        throw new Error('Le fichier doit être lié à un projet ou une tâche');
      }
    },
  },
});

// Méthode d'instance pour obtenir la taille formatée
File.prototype.getFormattedSize = function () {
  const bytes = this.fileSize;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Byte';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

// Méthode d'instance pour vérifier si c'est une image
File.prototype.isImage = function () {
  return this.fileType === 'IMAGE' || this.mimeType.startsWith('image/');
};

// Méthode d'instance pour vérifier si c'est un PDF
File.prototype.isPDF = function () {
  return this.fileType === 'PDF' || this.mimeType === 'application/pdf';
};

module.exports = File;