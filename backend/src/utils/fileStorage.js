const fs = require('fs');
const path = require('path');
const AppError = require('./AppError');

const defaultUploadDir = path.resolve(path.join(__dirname, '../../uploads'));
const configuredUploadDir = process.env.FILE_STORAGE_DIR;
const uploadDir = configuredUploadDir
  ? path.resolve(configuredUploadDir)
  : defaultUploadDir;

function isWithinUploadDir(filePath) {
  const relativePath = path.relative(uploadDir, path.resolve(filePath));
  return (
    relativePath &&
    relativePath !== '..' &&
    !relativePath.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relativePath)
  );
}

function resolveStoredPath(storedUrl) {
  if (!storedUrl) return null;

  const storedName = path.basename(storedUrl);
  const resolvedPath = path.join(uploadDir, storedName);
  return isWithinUploadDir(resolvedPath) ? resolvedPath : null;
}

async function removeStoredFile(filePath) {
  if (!filePath || !isWithinUploadDir(filePath)) {
    throw new Error('Refusing to remove a path outside the upload directory');
  }

  try {
    await fs.promises.unlink(filePath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

function hasPrefix(buffer, prefix) {
  return buffer.subarray(0, prefix.length).equals(Buffer.from(prefix));
}

function detectMimeType(buffer) {
  if (hasPrefix(buffer, '%PDF-')) return 'application/pdf';
  if (hasPrefix(buffer, Buffer.from([0xff, 0xd8, 0xff]))) return 'image/jpeg';
  if (hasPrefix(buffer, Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'image/png';
  }
  if (hasPrefix(buffer, 'GIF87a') || hasPrefix(buffer, 'GIF89a')) return 'image/gif';
  if (hasPrefix(buffer, 'BM')) return 'image/bmp';
  if (
    hasPrefix(buffer, Buffer.from([0x49, 0x49, 0x2a, 0x00])) ||
    hasPrefix(buffer, Buffer.from([0x4d, 0x4d, 0x00, 0x2a]))
  ) {
    return 'image/tiff';
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(4, 8).toString('ascii') === 'ftyp' &&
    /^(heic|heix|hevc|hevx|mif1|msf1)$/.test(buffer.subarray(8, 12).toString('ascii'))
  ) {
    return 'image/heic';
  }

  return null;
}

const compatibleMimeTypes = {
  'application/pdf': ['application/pdf'],
  'image/jpeg': ['image/jpeg', 'image/jpg', 'image/pjpeg'],
  'image/png': ['image/png'],
  'image/gif': ['image/gif'],
  'image/bmp': ['image/bmp', 'image/x-ms-bmp'],
  'image/tiff': ['image/tiff'],
  'image/webp': ['image/webp'],
  'image/heic': ['image/heic', 'image/heif'],
};

async function validateFileContent(file) {
  let contents;
  try {
    contents = await fs.promises.readFile(file.path);
  } catch (error) {
    throw new AppError('Uploaded file content is unavailable', 400);
  }

  const detectedMimeType = detectMimeType(contents);
  const declaredMimeType = (file.mimetype || '').toLowerCase();
  const compatibleTypes = compatibleMimeTypes[detectedMimeType] || [];

  if (!detectedMimeType || !compatibleTypes.includes(declaredMimeType)) {
    throw new AppError('File content does not match its declared type', 400);
  }

  return detectedMimeType;
}

module.exports = {
  uploadDir,
  isWithinUploadDir,
  resolveStoredPath,
  removeStoredFile,
  detectMimeType,
  validateFileContent,
};
