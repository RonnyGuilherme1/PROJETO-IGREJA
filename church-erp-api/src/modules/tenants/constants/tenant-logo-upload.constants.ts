import { join } from 'path';

export const TENANT_LOGO_MAX_FILE_SIZE = 1024 * 1024;

export const TENANT_LOGO_ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
]);

export const TENANT_LOGO_ALLOWED_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
]);

export const TENANT_LOGO_UPLOAD_ROOT = join(process.cwd(), 'uploads');
export const TENANT_LOGO_UPLOAD_DIRECTORY = join(
  TENANT_LOGO_UPLOAD_ROOT,
  'tenant-logos',
);
export const TENANT_LOGO_PUBLIC_BASE_PATH = '/api/uploads/tenant-logos';
