import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

function resolveCorsOrigin(corsOrigin?: string): true | string | string[] {
  if (!corsOrigin || corsOrigin === '*') {
    return true;
  }

  const origins = corsOrigin
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length === 1 ? origins[0] : origins;
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.enableShutdownHooks();
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: resolveCorsOrigin(configService.get<string>('CORS_ORIGIN')),
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

  const port = 3001;

  await app.listen(port, '0.0.0.0');
}

bootstrap();
