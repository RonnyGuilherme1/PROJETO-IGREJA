import { Module } from '@nestjs/common';

import { ChurchesController } from './churches.controller';
import { ChurchesService } from './churches.service';
import { TenantChurchesController } from './tenant-churches.controller';

@Module({
  controllers: [ChurchesController, TenantChurchesController],
  providers: [ChurchesService],
})
export class ChurchesModule {}
