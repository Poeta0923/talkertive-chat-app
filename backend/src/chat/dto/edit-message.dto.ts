import { IsString } from 'class-validator';

export class EditMessageDto {
  // 수정할 메시지 ID
  @IsString()
  messageId: string;

  // 수정된 텍스트 내용
  @IsString()
  content: string;
}
