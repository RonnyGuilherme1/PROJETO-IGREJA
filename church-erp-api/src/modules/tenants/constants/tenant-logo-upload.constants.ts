import 'dotenv/config';

import { isAbsolute, join } from 'path';

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

const configuredUploadRoot = process.env.UPLOAD_ROOT?.trim();

export const TENANT_LOGO_UPLOAD_ROOT =
  configuredUploadRoot && configuredUploadRoot.length > 0
    ? isAbsolute(configuredUploadRoot)
      ? configuredUploadRoot
      : join(process.cwd(), configuredUploadRoot)
    : join(process.cwd(), 'uploads');
export const TENANT_LOGO_UPLOAD_DIRECTORY = join(
  TENANT_LOGO_UPLOAD_ROOT,
  'tenant-logos',
);
export const TENANT_LOGO_PUBLIC_BASE_PATH = '/api/uploads/tenant-logos';
