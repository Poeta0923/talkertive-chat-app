import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateBannerDto {
  @ApiPropertyOptional({ description: '배너 클릭 시 이동할 URL' })
  @IsOptional()
  @IsString()
  linkUrl?: string;
}
