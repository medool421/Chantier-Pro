const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { uploadDir } = require('../utils/fileStorage');
const { assertIsolatedTestUploadDirectory } = require('../utils/storagePathSafety');

if (process.env.NODE_ENV === 'test') {
  const configuredStorage = process.env.FILE_STORAGE_DIR;
  if (!configuredStorage) {
    throw new Error('Test uploads require an isolated FILE_STORAGE_DIR');
  }
  assertIsolatedTestUploadDirectory(
    uploadDir,
    path.resolve(__dirname, '../../uploads')
  );
}

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const baseName = path
      .basename(file.originalname, extension)
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 80) || 'file';
    const uniqueName = `${Date.now()}-${crypto.randomUUID()}-${baseName}${extension}`;
    cb(null, uniqueName);
  },
});

module.exports = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const isImage = file.mimetype.startsWith('image/');
    const isPdf = file.mimetype === 'application/pdf';

    if (!isImage && !isPdf) {
      return cb(new Error('Only image and PDF files are supported'));
    }

    cb(null, true);
  },
});
