import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RoomCategory, RoomType } from 'generated/prisma';

export class AdminRoomQueryDto {
  @ApiPropertyOptional({ description: '건너뛸 수', type: Number })
  @IsOptional()
  @IsString()
  skip?: string;

  @ApiPropertyOptional({ description: '가져올 수', type: Number })
  @IsOptional()
  @IsString()
  take?: string;

  @ApiPropertyOptional({ description: '모임 이름 검색어' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: '카테고리 필터', enum: RoomCategory })
  @IsOptional()
  @IsEnum(RoomCategory)
  category?: RoomCategory;

  @ApiPropertyOptional({ description: '방 타입 필터', enum: RoomType })
  @IsOptional()
  @IsEnum(RoomType)
  type?: RoomType;
}
