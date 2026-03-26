import 'reflect-metadata';

import { mkdirSync } from 'fs';
import express from 'express';
import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { TENANT_LOGO_UPLOAD_ROOT } from './modules/tenants/constants/tenant-logo-upload.constants';

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

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const uploadRoot = join(TENANT_LOGO_UPLOAD_ROOT);

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
