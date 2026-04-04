import { Message } from './message';
import { User } from './user';
import { ApiProperty } from '@nestjs/swagger';

export class MessageRead {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  messageId: string;

  @ApiProperty({ type: String })
  userId: string;

  @ApiProperty({ type: () => Message })
  message: Message;

  @ApiProperty({ type: () => User })
  user: User;

  @ApiProperty({ type: Date })
  readAt: Date;
}
