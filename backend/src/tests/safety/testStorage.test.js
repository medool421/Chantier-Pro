const fs = require('fs');
const os = require('os');
const path = require('path');

const { createTestStorageManager } = require('../../tests/testStorage');
const { assertIsolatedTestUploadDirectory } = require('../../utils/storagePathSafety');

function makeFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'chantierpro-storage-safety-'));
  const parent = path.join(root, 'test-parent');
  const uploads = path.join(root, 'uploads');
  fs.mkdirSync(parent);
  fs.mkdirSync(uploads);
  return { root, parent, uploads };
}

function removeFixture(root) {
  if (root && fs.existsSync(root)) fs.rmSync(root, { recursive: true, force: true });
}

describe('isolated test storage', () => {
  let fixture;

  beforeEach(() => {
    fixture = makeFixture();
  });

  afterEach(() => {
    removeFixture(fixture && fixture.root);
  });

  function manager() {
    return createTestStorageManager({
      environment: {
        NODE_ENV: 'test',
        TEST_FILE_STORAGE_PARENT: fixture.parent,
      },
      defaultDirectory: fixture.uploads,
      setStorageEnvironment: false,
    });
  }

  test('creates and removes only its own unique directory', () => {
    const storage = manager();
    const root = storage.createIsolatedTestStorageRoot();
    expect(path.dirname(root)).toBe(fixture.parent);
    expect(fs.existsSync(root)).toBe(true);

    storage.cleanupIsolatedTestStorageRoot();
    expect(fs.existsSync(root)).toBe(false);
    expect(fs.existsSync(fixture.parent)).toBe(true);
  });

  test('refuses cleanup when its root is missing or replaced', () => {
    const storage = manager();
    const root = storage.createIsolatedTestStorageRoot();
    const marker = fs.readFileSync(path.join(root, '.chantierpro-test-storage'), 'utf8');
    fs.rmSync(root, { recursive: true, force: true });
    fs.mkdirSync(root);
    fs.writeFileSync(path.join(root, '.chantierpro-test-storage'), marker);

    expect(storage.cleanupIsolatedTestStorageRoot).toThrow('not created by this run');
    expect(fs.existsSync(root)).toBe(true);
  });

  test('refuses cleanup when its root is missing', () => {
    const storage = manager();
    const root = storage.createIsolatedTestStorageRoot();
    fs.rmSync(root, { recursive: true, force: true });

    expect(storage.cleanupIsolatedTestStorageRoot).toThrow('must already exist');
  });

  test('refuses cleanup when its ownership marker is changed', () => {
    const storage = manager();
    const root = storage.createIsolatedTestStorageRoot();
    fs.writeFileSync(path.join(root, '.chantierpro-test-storage'), '{"runId":"replacement"}\n');

    expect(storage.cleanupIsolatedTestStorageRoot).toThrow('invalid ownership marker');
    expect(fs.existsSync(root)).toBe(true);
  });

  test('rejects a configured upload directory inside backend uploads', () => {
    expect(() => assertIsolatedTestUploadDirectory(fixture.uploads, fixture.uploads))
      .toThrow('separate from backend/uploads');
  });

  test('rejects a symlinked upload directory when symlinks are available', () => {
    const linkedDirectory = path.join(fixture.root, 'linked-upload');
    try {
      fs.symlinkSync(fixture.uploads, linkedDirectory, process.platform === 'win32' ? 'junction' : 'dir');
    } catch (error) {
      if (process.platform === 'win32' && ['EPERM', 'EACCES'].includes(error.code)) return;
      throw error;
    }

    expect(() => assertIsolatedTestUploadDirectory(linkedDirectory, fixture.uploads))
      .toThrow('non-symlink directory');
  });

  test('rejects a symlinked test-storage parent when symlinks are available', () => {
    const linkedParent = path.join(fixture.root, 'linked-parent');
    try {
      fs.symlinkSync(fixture.uploads, linkedParent, process.platform === 'win32' ? 'junction' : 'dir');
    } catch (error) {
      // Windows hosts without Developer Mode or the SeCreateSymbolicLink
      // privilege cannot create this fixture. The non-link checks still run.
      if (process.platform === 'win32' && ['EPERM', 'EACCES'].includes(error.code)) return;
      throw error;
    }

    const storage = createTestStorageManager({
      environment: { NODE_ENV: 'test', TEST_FILE_STORAGE_PARENT: linkedParent },
      defaultDirectory: fixture.uploads,
      setStorageEnvironment: false,
    });
    expect(storage.createIsolatedTestStorageRoot).toThrow('non-symlink directory');
  });

  test('refuses cleanup when the owned root is replaced by a symlink', () => {
    const storage = manager();
    const root = storage.createIsolatedTestStorageRoot();
    const replacement = path.join(fixture.root, 'replacement');
    fs.mkdirSync(replacement);
    fs.rmSync(root, { recursive: true, force: true });
    try {
      fs.symlinkSync(replacement, root, process.platform === 'win32' ? 'junction' : 'dir');
    } catch (error) {
      if (process.platform === 'win32' && ['EPERM', 'EACCES'].includes(error.code)) return;
      throw error;
    }

    expect(storage.cleanupIsolatedTestStorageRoot).toThrow('non-symlink directory');
    expect(fs.existsSync(replacement)).toBe(true);
  });
});
