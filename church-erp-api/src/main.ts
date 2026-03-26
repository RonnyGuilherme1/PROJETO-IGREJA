import 'reflect-metadata';

import { existsSync, mkdirSync, readFileSync } from 'fs';
import express from 'express';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

function resolveCorsOrigin(
  corsOrigin?: string,
  nodeEnv?: string,
): boolean | string | string[] {
  const isProduction = nodeEnv === 'production';
  const normalizedCorsOrigin = String(corsOrigin ?? '').trim();

  if (normalizedCorsOrigin.length === 0 || normalizedCorsOrigin === '*') {
    return !isProduction;
  }

  const origins = [
    ...new Set(
      normalizedCorsOrigin
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0 && origin !== '*'),
    ),
  ];

  if (origins.length === 0) {
    return !isProduction;
  }

  return origins.length === 1 ? origins[0] : origins;
}

function stripWrappingQuotes(value: string): string {
  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function loadLocalEnvFile(): void {
  const envFilePath = `${process.cwd()}/.env`;

  if (!existsSync(envFilePath)) {
    return;
  }

  const envFileContents = readFileSync(envFilePath, 'utf8');

  for (const line of envFileContents.split(/\r?\n/)) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');

    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();

    if (!key || process.env[key] !== undefined) {
      continue;
    }

    const rawValue = line.slice(separatorIndex + 1).trim();
    process.env[key] = stripWrappingQuotes(rawValue);
  }
}

async function bootstrap(): Promise<void> {
  loadLocalEnvFile();

  const [{ AppModule }, tenantLogoUploadConstants] = await Promise.all([
    import('./app.module'),
    import('./modules/tenants/constants/tenant-logo-upload.constants'),
  ]);
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const uploadRoot = tenantLogoUploadConstants.TENANT_LOGO_UPLOAD_ROOT;

  app.enableShutdownHooks();
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: resolveCorsOrigin(
      configService.get<string>('CORS_ORIGIN'),
      configService.get<string>('NODE_ENV'),
    ),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  mkdirSync(uploadRoot, { recursive: true });
  app.use('/api/uploads', express.static(uploadRoot));

  await app.listen(process.env.PORT || 3001, '0.0.0.0');
}

bootstrap();
