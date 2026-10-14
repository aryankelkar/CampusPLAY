import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export const MAX_FILE_SIZE = process.env.MAX_UPLOAD_SIZE_BYTES 
  ? Number(process.env.MAX_UPLOAD_SIZE_BYTES) 
  : 10 * 1024 * 1024; // 10 MB

/**
 * Validates actual binary content using file signatures (magic bytes)
 * Do not trust filenames, extensions, or client MIME types alone.
 */
export function detectFileTypeFromBuffer(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length < 8) {
    return null;
  }

  // PDF: starts with '%PDF-' (0x25, 0x50, 0x44, 0x46, 0x2D)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2D
  ) {
    return {
      mimeType: 'application/pdf',
      documentType: 'pdf',
      extension: 'pdf',
    };
  }

  // PNG: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4E &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0D &&
    buffer[5] === 0x0A &&
    buffer[6] === 0x1A &&
    buffer[7] === 0x0A
  ) {
    return {
      mimeType: 'image/png',
      documentType: 'image',
      extension: 'png',
    };
  }

  // JPEG / JPG: 0xFF 0xD8 0xFF
  if (
    buffer[0] === 0xFF &&
    buffer[1] === 0xD8 &&
    buffer[2] === 0xFF
  ) {
    return {
      mimeType: 'image/jpeg',
      documentType: 'image',
      extension: 'jpg',
    };
  }

  // WebP: starts with 'RIFF' (0x52, 0x49, 0x46, 0x46) and at offset 8 has 'WEBP' (0x57, 0x45, 0x42, 0x50)
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return {
      mimeType: 'image/webp',
      documentType: 'image',
      extension: 'webp',
    };
  }

  return null;
}

/**
 * Returns the absolute base directory where timetable documents are persistently stored.
 */
export function getStorageDirectory() {
  const dir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads', 'timetables');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Generates an unguessable safe filename to prevent path traversal or overwriting
 */
export function generateSafeStorageIdentifier({ branch, academicYear, division, extension }) {
  const safeBranch = String(branch || 'GEN').replace(/[^a-zA-Z0-9]/g, '');
  const safeYear = String(academicYear || 'YR').replace(/[^a-zA-Z0-9]/g, '');
  const safeDiv = String(division || 'DIV').replace(/[^a-zA-Z0-9]/g, '');
  const rand = crypto.randomBytes(8).toString('hex');
  return `tt_${safeBranch}_${safeYear}_${safeDiv}_${Date.now()}_${rand}.${extension}`;
}

/**
 * Stores file buffer to persistent disk storage safely
 */
export async function saveDocumentBuffer({
  buffer,
  originalFilename,
  branch,
  academicYear,
  division,
}) {
  // 1. Size Validation
  if (buffer.length > MAX_FILE_SIZE) {
    const sizeMb = (buffer.length / (1024 * 1024)).toFixed(2);
    const maxMb = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
    throw new Error(`File size (${sizeMb} MB) exceeds maximum allowed limit (${maxMb} MB).`);
  }

  // 2. Binary Magic Bytes Validation
  const detected = detectFileTypeFromBuffer(buffer);
  if (!detected) {
    throw new Error(
      'Invalid or unsupported file format. Official timetable documents must be valid PDF, JPEG, PNG, or WebP files.'
    );
  }

  // 3. Generate safe path
  const storageDir = getStorageDirectory();
  const storageIdentifier = generateSafeStorageIdentifier({
    branch,
    academicYear,
    division,
    extension: detected.extension,
  });

  const targetPath = path.join(storageDir, storageIdentifier);

  // Anti-path-traversal assertion
  if (!targetPath.startsWith(storageDir)) {
    throw new Error('Security error: Invalid storage destination path.');
  }

  // 4. Write to disk
  await fs.promises.writeFile(targetPath, buffer);

  return {
    storageIdentifier,
    storageProvider: 'local',
    mimeType: detected.mimeType,
    documentType: detected.documentType,
    extension: detected.extension,
    fileSize: buffer.length,
    absolutePath: targetPath,
  };
}

/**
 * Safely resolves and reads an existing stored file buffer
 */
export async function getDocumentBuffer(storageIdentifier) {
  if (!storageIdentifier || typeof storageIdentifier !== 'string') {
    throw new Error('Invalid storage identifier.');
  }

  // Prevent path traversal
  const sanitized = path.basename(storageIdentifier);
  const storageDir = getStorageDirectory();
  const filePath = path.join(storageDir, sanitized);

  if (!filePath.startsWith(storageDir) || !fs.existsSync(filePath)) {
    return null;
  }

  const buffer = await fs.promises.readFile(filePath);
  return {
    buffer,
    filePath,
  };
}

/**
 * Deletes a stored file
 */
export async function deleteDocumentFile(storageIdentifier) {
  try {
    const sanitized = path.basename(storageIdentifier);
    const storageDir = getStorageDirectory();
    const filePath = path.join(storageDir, sanitized);
    if (filePath.startsWith(storageDir) && fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return true;
    }
  } catch (err) {
    console.warn('Could not delete storage file:', err.message);
  }
  return false;
}
