import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoomCategory } from '../../../generated/prisma';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateGroupRoomDto {
  @ApiProperty({ description: '모임 이름' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: '모임 상세 설명 (마크다운)' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '목록용 한 줄 소개' })
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiPropertyOptional({
    description: '최대 인원 (null이면 무제한)',
    example: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(2)
  memberLimit?: number;

  @ApiPropertyOptional({ enum: RoomCategory, description: '모임 카테고리' })
  @IsOptional()
  @IsEnum(RoomCategory)
  category?: RoomCategory;

  @ApiPropertyOptional({ description: '모임 장소 주소' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: '모임 일정',
    example: '2026-05-01T14:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ description: '커버 이미지 URL' })
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiPropertyOptional({ description: '프로필 이미지 URL' })
  @IsOptional()
  @IsString()
  profileImage?: string;
}
