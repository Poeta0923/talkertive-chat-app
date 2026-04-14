import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: '사용자 이름' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({ description: '자기소개 (짧은 설명)', maxLength: 150 })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  description?: string;
}
