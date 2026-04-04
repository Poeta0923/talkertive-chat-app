import { Room } from './room';
import { User } from './user';
import { MessageAttachment } from './message_attachment';
import { MessageRead } from './message_read';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Message {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  roomId: string;

  @ApiProperty({ type: String })
  senderId: string;

  @ApiPropertyOptional({ type: String })
  content?: string;

  @ApiProperty({ type: Boolean })
  isEdited: boolean;

  @ApiPropertyOptional({ type: Date })
  deletedAt?: Date;

  @ApiProperty({ type: () => Room })
  room: Room;

  @ApiProperty({ type: () => User })
  sender: User;

  @ApiProperty({ isArray: true, type: () => MessageAttachment })
  attachments: MessageAttachment[];

  @ApiProperty({ isArray: true, type: () => MessageRead })
  reads: MessageRead[];

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}
