import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateDirectRoomDto {
  @ApiProperty({ description: '1대1 채팅 상대방의 userId' })
  @IsString()
  targetUserId: string;
}
