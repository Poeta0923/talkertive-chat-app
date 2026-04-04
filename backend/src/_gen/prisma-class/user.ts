import { Account } from './account';
import { Session } from './session';
import { RoomMember } from './room_member';
import { Message } from './message';
import { MessageRead } from './message_read';
import { RoomLike } from './room_like';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class User {
  @ApiProperty({ type: String })
  id: string;

  @ApiPropertyOptional({ type: String })
  name?: string;

  @ApiPropertyOptional({ type: String })
  email?: string;

  @ApiPropertyOptional({ type: Date })
  emailVerified?: Date;

  @ApiPropertyOptional({ type: String })
  image?: string;

  @ApiPropertyOptional({ type: String })
  hashedPassword?: string;

  @ApiProperty({ isArray: true, type: () => Account })
  accounts: Account[];

  @ApiProperty({ isArray: true, type: () => Session })
  sessions: Session[];

  @ApiProperty({ isArray: true, type: () => RoomMember })
  roomMembers: RoomMember[];

  @ApiProperty({ isArray: true, type: () => Message })
  messages: Message[];

  @ApiProperty({ isArray: true, type: () => MessageRead })
  messageReads: MessageRead[];

  @ApiProperty({ isArray: true, type: () => RoomLike })
  roomLikes: RoomLike[];

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}
