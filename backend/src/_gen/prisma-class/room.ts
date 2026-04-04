import { RoomMember } from './room_member';
import { Message } from './message';
import { RoomLike } from './room_like';
import { RoomType, RoomCategory } from 'generated/prisma';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Room {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ enum: RoomType, enumName: 'RoomType' })
  type: RoomType = RoomType.DIRECT;

  @ApiPropertyOptional({ type: String })
  name?: string;

  @ApiPropertyOptional({ type: String })
  slug?: string;

  @ApiPropertyOptional({ type: String })
  coverImage?: string;

  @ApiPropertyOptional({ type: String })
  profileImage?: string;

  @ApiPropertyOptional({ type: String })
  description?: string;

  @ApiPropertyOptional({ type: String })
  shortDescription?: string;

  @ApiPropertyOptional({ type: Number })
  memberLimit?: number;

  @ApiPropertyOptional({ enum: RoomCategory, enumName: 'RoomCategory' })
  category?: RoomCategory;

  @ApiPropertyOptional({ type: String })
  address?: string;

  @ApiPropertyOptional({ type: Date })
  date?: Date;

  @ApiProperty({ isArray: true, type: () => RoomMember })
  members: RoomMember[];

  @ApiProperty({ isArray: true, type: () => Message })
  messages: Message[];

  @ApiProperty({ isArray: true, type: () => RoomLike })
  likes: RoomLike[];

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}
