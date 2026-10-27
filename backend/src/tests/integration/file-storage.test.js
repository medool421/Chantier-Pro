const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { createTestStorageManager } = require('../testStorage');

const {
  detectMimeType,
  validateFileContent,
} = require('../../utils/fileStorage');

describe('file storage content validation', () => {
  const temporaryStorage = createTestStorageManager({
    environment: {
      NODE_ENV: 'test',
      TEST_FILE_STORAGE_PARENT: os.tmpdir(),
    },
    setStorageEnvironment: false,
  });
  let temporaryDirectory;

  beforeAll(() => {
    temporaryDirectory = temporaryStorage.createIsolatedTestStorageRoot();
  });

  test('uses a unique private temporary directory for this test run', () => {
    expect(path.basename(temporaryDirectory).startsWith('chantierpro-jest-')).toBe(true);
    expect(temporaryDirectory).not.toBe(os.tmpdir());
  });

  afterAll(() => {
    temporaryStorage.cleanupIsolatedTestStorageRoot();
  });

  const validFiles = [
    {
      extension: 'jpeg',
      bytes: [0xff, 0xd8, 0xff, 0xe1, 0x00, 0x58, 0x45, 0x78, 0x69, 0x66],
      mimeType: 'image/jpeg',
    },
    {
      extension: 'png',
      bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
      mimeType: 'image/png',
    },
    {
      extension: 'pdf',
      bytes: Buffer.from('%PDF-1.7'),
      mimeType: 'application/pdf',
    },
  ];

  validFiles.forEach(({ extension, bytes, mimeType }) => {
    test(`detects and accepts valid ${mimeType} content`, async () => {
      const fileBytes = Buffer.from(bytes);
      const temporaryFile = path.join(temporaryDirectory, `content.${extension}`);
      await fs.writeFile(temporaryFile, fileBytes);

      expect(detectMimeType(fileBytes)).toBe(mimeType);
      const detectedMimeType = await validateFileContent({
        path: temporaryFile,
        mimetype: mimeType,
      });
      expect(detectedMimeType).toBe(mimeType);
    });
  });

  test('rejects a file when its declared MIME type does not match its signature', async () => {
    const jpegBytes = Buffer.from([0xff, 0xd8, 0xff, 0xe1]);
    const temporaryFile = path.join(temporaryDirectory, 'mismatched-content.bin');
    await fs.writeFile(temporaryFile, jpegBytes);

    let validationError;
    try {
      await validateFileContent({
        path: temporaryFile,
        mimetype: 'application/pdf',
      });
    } catch (error) {
      validationError = error;
    }

    expect(validationError && validationError.message).toBe('File content does not match its declared type');
  });
});
