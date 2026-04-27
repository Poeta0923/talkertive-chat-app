import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AdminUserQueryDto {
  @ApiPropertyOptional({ description: '건너뛸 수', type: Number })
  @IsOptional()
  @IsString()
  skip?: string;

  @ApiPropertyOptional({ description: '가져올 수', type: Number })
  @IsOptional()
  @IsString()
  take?: string;

  @ApiPropertyOptional({ description: '이름 또는 이메일 검색어' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: '역할 필터 (USER | ADMIN)' })
  @IsOptional()
  @IsString()
  role?: string;
}
