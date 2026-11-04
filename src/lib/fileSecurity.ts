/**
 * File Security & Magic Byte Signature Verification for Printing Hub
 *
 * Supported formats:
 * - JPG / JPEG: FF D8 FF
 * - PNG: 89 50 4E 47 0D 0A 1A 0A
 * - PDF: 25 50 44 46 (%PDF)
 * - WEBP: RIFF....WEBP
 * - HEIC / HEIF: ISOBMFF box with 'ftyp' and brand in (heic, heix, hevc, hevx, mif1, msf1)
 */

export const ALLOWED_CATEGORIES = ['photos', 'ids', 'documents', 'other'] as const;
export type UploadCategory = (typeof ALLOWED_CATEGORIES)[number];

export interface DetectedFileType {
  ext: 'jpg' | 'png' | 'pdf' | 'webp' | 'heic';
  mime: string;
}

export const DEFAULT_MAX_UPLOAD_SIZE_MB = 10;

export function getMaxUploadSizeBytes(): number {
  const envMb = parseInt(process.env.MAX_UPLOAD_SIZE_MB || '10', 10);
  const sizeMb = isNaN(envMb) || envMb <= 0 ? DEFAULT_MAX_UPLOAD_SIZE_MB : envMb;
  return sizeMb * 1024 * 1024;
}

export function isValidCategory(category: string): category is UploadCategory {
  return (ALLOWED_CATEGORIES as readonly string[]).includes(category);
}

const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'pdf']);
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf',
]);

/**
 * Pre-validation of client-declared metadata prior to issuing a signed upload URL.
 */
export function validateUploadMetadata(params: {
  filename?: string;
  mimeType?: string;
  size?: number;
  category?: string;
}): { valid: boolean; error?: string; safeExt?: string } {
  const { filename, mimeType, size, category } = params;

  if (!filename || typeof filename !== 'string') {
    return { valid: false, error: 'File name is required.' };
  }

  if (!category || !isValidCategory(category.toLowerCase().trim())) {
    return {
      valid: false,
      error: 'Invalid upload category. Allowed categories are: photos, ids, documents, other.',
    };
  }

  if (typeof size !== 'number' || size <= 0) {
    return { valid: false, error: 'The selected file is empty (0 bytes). Please choose a valid file.' };
  }

  const maxBytes = getMaxUploadSizeBytes();
  const maxMb = Math.round(maxBytes / (1024 * 1024));
  if (size > maxBytes) {
    return {
      valid: false,
      error: `File size exceeds the ${maxMb} MB limit. Please select a smaller file or compress it before uploading.`,
    };
  }

  const extMatch = filename.split('.').pop()?.toLowerCase();
  if (!extMatch || !ALLOWED_EXTENSIONS.has(extMatch)) {
    return {
      valid: false,
      error: 'Unsupported file extension. Only JPG, PNG, WEBP, HEIC, and PDF files are allowed.',
    };
  }

  if (mimeType && !ALLOWED_MIME_TYPES.has(mimeType.toLowerCase()) && mimeType !== 'application/octet-stream') {
    return {
      valid: false,
      error: 'Unsupported file MIME type. Only JPG, PNG, WEBP, HEIC, and PDF files are allowed.',
    };
  }

  const safeExt = extMatch === 'jpeg' ? 'jpg' : extMatch === 'heif' ? 'heic' : extMatch;
  return { valid: true, safeExt };
}

/**
 * Inspect file header bytes (magic bytes) to determine actual file type.
 * Rejects disguised files (e.g. an HTML/JS script renamed to image.png).
 */
export function detectFileType(buffer: Buffer): DetectedFileType | null {
  if (!buffer || buffer.length < 12) {
    return null;
  }

  // 1. JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ext: 'jpg', mime: 'image/jpeg' };
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { ext: 'png', mime: 'image/png' };
  }

  // 3. PDF: 25 50 44 46 (%PDF)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return { ext: 'pdf', mime: 'application/pdf' };
  }

  // 4. WEBP: RIFF [4 bytes size] WEBP
  // Bytes 0-3: 0x52 0x49 0x46 0x46 ('RIFF')
  // Bytes 8-11: 0x57 0x45 0x42 0x50 ('WEBP')
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { ext: 'webp', mime: 'image/webp' };
  }

  // 5. HEIC / HEIF: ISOBMFF box with 'ftyp' at offset 4
  // Bytes 4-7: 0x66 0x74 0x79 0x70 ('ftyp')
  if (
    buffer.length >= 16 &&
    buffer[4] === 0x66 &&
    buffer[5] === 0x74 &&
    buffer[6] === 0x79 &&
    buffer[7] === 0x70
  ) {
    const brandStr = buffer.subarray(8, Math.min(buffer.length, 64)).toString('ascii').toLowerCase();
    const heicBrands = ['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1', 'heim', 'heis', 'hevm', 'hevs'];
    if (heicBrands.some(brand => brandStr.includes(brand))) {
      return { ext: 'heic', mime: 'image/heic' };
    }
  }

  return null;
}

/**
 * Sanitize client-supplied file name for display metadata only.
 * Strips directory traversal, control characters, and limits length.
 */
export function sanitizeDisplayName(name?: string): string {
  if (!name || typeof name !== 'string') return 'uploaded_file';
  const basename = name.split(/[/\\]/).pop() || 'uploaded_file';
  const clean = basename.replace(/[^a-zA-Z0-9._\-\s()]/g, '_').trim();
  return clean.slice(0, 180) || 'uploaded_file';
}

