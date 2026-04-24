import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateScheduleDto {
  @ApiPropertyOptional({ description: '일정 이름' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: '일정 시각',
    example: '2026-05-01T14:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  time?: string;
}
