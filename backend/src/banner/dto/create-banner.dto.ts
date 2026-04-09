import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUrl } from 'class-validator';

export class CreateBannerDto {
  @ApiProperty({ description: '배너 이미지 URL' })
  @IsString()
  @IsUrl()
  imageUrl!: string;

  @ApiProperty({ description: '배너 클릭 시 이동할 링크 URL (외부 URL 또는 내부 경로)' })
  @IsString()
  linkUrl!: string;
}
