import { isAbsolute, join, resolve } from 'path';

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

function resolveTenantLogoUploadRoot(): string {
  const configuredUploadRoot = String(process.env.UPLOAD_ROOT ?? '').trim();

  if (configuredUploadRoot.length === 0) {
    return join(process.cwd(), 'uploads');
  }

  return isAbsolute(configuredUploadRoot)
    ? configuredUploadRoot
    : resolve(process.cwd(), configuredUploadRoot);
}

export const TENANT_LOGO_UPLOAD_ROOT = resolveTenantLogoUploadRoot();
export const TENANT_LOGO_UPLOAD_DIRECTORY = join(
  TENANT_LOGO_UPLOAD_ROOT,
  'tenant-logos',
);
export const TENANT_LOGO_PUBLIC_BASE_PATH = '/api/uploads/tenant-logos';
