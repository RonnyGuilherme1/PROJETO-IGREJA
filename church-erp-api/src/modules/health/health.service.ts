import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma/prisma.service';
import { HealthResponseDto } from './dto/health-response.dto';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthResponseDto> {
    await this.prisma.$queryRaw`SELECT 1`;

    return new HealthResponseDto({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  }
}
