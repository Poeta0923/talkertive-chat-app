import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString } from 'class-validator';

export class CreateScheduleDto {
  @ApiProperty({ description: '일정 이름' })
  @IsString()
  name: string;

  @ApiProperty({ description: '일정 시각', example: '2026-05-01T14:00:00.000Z' })
  @IsDateString()
  time: string;
}
