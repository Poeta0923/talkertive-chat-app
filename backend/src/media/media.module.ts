import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { MulterModule } from '@nestjs/platform-express';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [
    MulterModule.register({
      limits: {
        fileSize: 100 * 1024 * 1024,
      },
    }),
  ],
  controllers: [MediaController],
  providers: [MediaService, RolesGuard],
  exports: [MediaService],
})
export class MediaModule {}
