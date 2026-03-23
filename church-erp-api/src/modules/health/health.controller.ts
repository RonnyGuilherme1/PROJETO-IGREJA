import { Controller, Get } from '@nestjs/common';

import { HealthResponseDto } from './dto/health-response.dto';
import { HealthService } from './health.service';

@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('health')
  check(): Promise<HealthResponseDto> {
    return this.healthService.check();
  }
}
