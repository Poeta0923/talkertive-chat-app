import { IsString } from 'class-validator';

export class DeleteMessageDto {
  // 삭제할 메시지 ID
  @IsString()
  messageId: string;
}
