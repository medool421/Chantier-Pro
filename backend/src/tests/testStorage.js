const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {
  assertExistingDirectory,
  assertSeparatePaths,
  isSameOrWithin,
  samePath,
} = require('../utils/storagePathSafety');

const testStoragePrefix = 'chantierpro-jest-';
const markerFile = '.chantierpro-test-storage';
const defaultStorageDirectory = path.resolve(__dirname, '../../uploads');

function safetyError(message) {
  return new Error(`Test file storage guard: ${message}`);
}

function directoryIdentity(directory) {
  const stats = fs.lstatSync(directory);
  if (stats.isSymbolicLink() || !stats.isDirectory()) {
    throw safetyError('storage root must be a non-symlink directory');
  }
  if (!Number.isInteger(stats.dev) || !Number.isInteger(stats.ino) || stats.ino === 0) {
    throw safetyError('storage root identity is unavailable; refusing automatic cleanup');
  }
  return { dev: stats.dev, ino: stats.ino };
}

function removeDirectoryWithoutFollowingLinks(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    const stats = fs.lstatSync(entryPath);
    if (stats.isSymbolicLink() || stats.isFile()) {
      fs.unlinkSync(entryPath);
    } else if (stats.isDirectory()) {
      removeDirectoryWithoutFollowingLinks(entryPath);
    } else {
      throw safetyError(`refusing to remove unsupported storage entry ${entry.name}`);
    }
  }
  fs.rmdirSync(directory);
}

function createTestStorageManager({
  environment = process.env,
  defaultDirectory = defaultStorageDirectory,
  setStorageEnvironment = true,
} = {}) {
  let ownedRoot;

  function createIsolatedTestStorageRoot() {
    if (environment.NODE_ENV !== 'test') {
      throw safetyError('NODE_ENV must be test');
    }
    if (ownedRoot) return ownedRoot.path;

    const configured = environment.TEST_FILE_STORAGE_PARENT;
    if (!configured || !configured.trim()) {
      throw safetyError('TEST_FILE_STORAGE_PARENT must be configured');
    }
    if (!path.isAbsolute(configured)) {
      throw safetyError('TEST_FILE_STORAGE_PARENT must be an absolute path');
    }

    const parent = assertExistingDirectory(configured, 'TEST_FILE_STORAGE_PARENT');
    const separation = assertSeparatePaths(parent.canonical, defaultDirectory, 'TEST_FILE_STORAGE_PARENT');
    const createdPath = fs.mkdtempSync(path.join(parent.canonical, testStoragePrefix));
    const canonicalPath = assertExistingDirectory(createdPath, 'created test storage root').canonical;

    if (!samePath(path.dirname(canonicalPath), parent.canonical) || !isSameOrWithin(canonicalPath, separation.candidatePath)) {
      throw safetyError('created test storage root is outside the canonical parent');
    }

    const runId = crypto.randomUUID();
    const markerContent = `${JSON.stringify({ runId })}\n`;
    fs.writeFileSync(path.join(canonicalPath, markerFile), markerContent, { encoding: 'utf8', flag: 'wx' });

    ownedRoot = {
      path: createdPath,
      canonicalPath,
      parentCanonicalPath: parent.canonical,
      identity: directoryIdentity(canonicalPath),
      markerContent,
      runId,
    };
    if (setStorageEnvironment) environment.FILE_STORAGE_DIR = createdPath;
    return createdPath;
  }

  function cleanupIsolatedTestStorageRoot() {
    if (!ownedRoot) return;

    const rootPath = path.resolve(ownedRoot.path);
    const rootInspection = assertExistingDirectory(rootPath, 'owned test storage root');
    if (
      !samePath(rootInspection.canonical, ownedRoot.canonicalPath)
      || !samePath(path.dirname(rootInspection.canonical), ownedRoot.parentCanonicalPath)
      || !isSameOrWithin(rootInspection.canonical, ownedRoot.parentCanonicalPath)
    ) {
      throw safetyError('refusing to remove a replaced or relocated storage directory');
    }

    const identity = directoryIdentity(rootPath);
    if (identity.dev !== ownedRoot.identity.dev || identity.ino !== ownedRoot.identity.ino) {
      throw safetyError('refusing to remove a storage directory not created by this run');
    }

    const markerPath = path.join(rootPath, markerFile);
    const markerStats = fs.lstatSync(markerPath);
    if (markerStats.isSymbolicLink() || !markerStats.isFile() || fs.readFileSync(markerPath, 'utf8') !== ownedRoot.markerContent) {
      throw safetyError('refusing to remove a storage directory with an invalid ownership marker');
    }

    removeDirectoryWithoutFollowingLinks(rootPath);
    ownedRoot = undefined;
  }

  return {
    createIsolatedTestStorageRoot,
    cleanupIsolatedTestStorageRoot,
  };
}

const defaultManager = createTestStorageManager();

module.exports = {
  createIsolatedTestStorageRoot: defaultManager.createIsolatedTestStorageRoot,
  cleanupIsolatedTestStorageRoot: defaultManager.cleanupIsolatedTestStorageRoot,
  createTestStorageManager,
  removeDirectoryWithoutFollowingLinks,
};
