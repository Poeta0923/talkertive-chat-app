import { Module } from '@nestjs/common';
import { BannerController } from './banner.controller';
import { BannerService } from './banner.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [MediaModule],
  controllers: [BannerController],
  providers: [BannerService, RolesGuard],
})
export class BannerModule {}
