import { Message } from './message';
import { AttachmentType } from 'generated/prisma';
import { ApiProperty } from '@nestjs/swagger';

export class MessageAttachment {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  messageId: string;

  @ApiProperty({ enum: AttachmentType, enumName: 'AttachmentType' })
  type: AttachmentType;

  @ApiProperty({ type: String })
  url: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: Number })
  size: number;

  @ApiProperty({ type: String })
  mimeType: string;

  @ApiProperty({ type: () => Message })
  message: Message;

  @ApiProperty({ type: Date })
  createdAt: Date;
}
