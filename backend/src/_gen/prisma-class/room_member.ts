import { Room } from './room';
import { User } from './user';
import { RoomMemberRole } from 'generated/prisma';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RoomMember {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  roomId: string;

  @ApiProperty({ type: String })
  userId: string;

  @ApiProperty({ enum: RoomMemberRole, enumName: 'RoomMemberRole' })
  role: RoomMemberRole = RoomMemberRole.MEMBER;

  @ApiPropertyOptional({ type: String })
  invitedBy?: string;

  @ApiPropertyOptional({ type: Date })
  leftAt?: Date;

  @ApiPropertyOptional({ type: Date })
  lastReadAt?: Date;

  @ApiProperty({ type: () => Room })
  room: Room;

  @ApiProperty({ type: () => User })
  user: User;

  @ApiProperty({ type: Date })
  createdAt: Date;
}
