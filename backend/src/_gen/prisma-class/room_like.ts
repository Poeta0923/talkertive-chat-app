import { Room } from './room';
import { User } from './user';
import { ApiProperty } from '@nestjs/swagger';

export class RoomLike {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  roomId: string;

  @ApiProperty({ type: String })
  userId: string;

  @ApiProperty({ type: () => Room })
  room: Room;

  @ApiProperty({ type: () => User })
  user: User;

  @ApiProperty({ type: Date })
  createdAt: Date;
}
