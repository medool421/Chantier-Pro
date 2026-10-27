const fs = require('fs');
const path = require('path');

function safetyError(message) {
  return new Error(`Test file storage guard: ${message}`);
}

function realpath(filePath) {
  const resolver = fs.realpathSync.native || fs.realpathSync;
  return resolver(filePath);
}

function samePath(left, right) {
  const normalize = (value) => {
    const resolved = path.resolve(value);
    return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
  };
  return normalize(left) === normalize(right);
}

function isSameOrWithin(candidate, parent) {
  const relative = path.relative(parent, candidate);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

// Resolve an existing path with realpath, or resolve a nonexistent suffix from
// its nearest existing ancestor. This reads the filesystem but never creates it.
function inspectPath(filePath) {
  const resolved = path.resolve(filePath);
  const missingSegments = [];
  let cursor = resolved;

  while (!fs.existsSync(cursor)) {
    const parent = path.dirname(cursor);
    if (parent === cursor) {
      throw safetyError(`cannot establish a canonical path for ${resolved}`);
    }
    missingSegments.unshift(path.basename(cursor));
    cursor = parent;
  }

  const ancestorStats = fs.lstatSync(cursor);
  const canonicalAncestor = realpath(cursor);
  const canonical = path.join(canonicalAncestor, ...missingSegments);
  const exists = missingSegments.length === 0;
  const stats = exists ? ancestorStats : null;

  return {
    resolved,
    canonical,
    exists,
    stats,
    isSymbolicLink: Boolean(stats && stats.isSymbolicLink()),
  };
}

function assertExistingDirectory(filePath, label) {
  const inspection = inspectPath(filePath);
  if (!inspection.exists) {
    throw safetyError(`${label} must already exist`);
  }
  if (inspection.isSymbolicLink || !inspection.stats.isDirectory()) {
    throw safetyError(`${label} must be a non-symlink directory`);
  }
  return inspection;
}

function assertSeparatePaths(candidate, protectedPath, label) {
  const candidatePath = inspectPath(candidate).canonical;
  const protectedCanonicalPath = inspectPath(protectedPath).canonical;
  if (
    isSameOrWithin(candidatePath, protectedCanonicalPath)
    || isSameOrWithin(protectedCanonicalPath, candidatePath)
  ) {
    throw safetyError(`${label} must be separate from backend/uploads`);
  }
  return { candidatePath, protectedPath: protectedCanonicalPath };
}

function assertIsolatedTestUploadDirectory(uploadDirectory, defaultUploadDirectory) {
  const upload = assertExistingDirectory(uploadDirectory, 'FILE_STORAGE_DIR');
  assertSeparatePaths(upload.canonical, defaultUploadDirectory, 'FILE_STORAGE_DIR');
  return upload.canonical;
}

module.exports = {
  safetyError,
  samePath,
  isSameOrWithin,
  inspectPath,
  assertExistingDirectory,
  assertSeparatePaths,
  assertIsolatedTestUploadDirectory,
};
