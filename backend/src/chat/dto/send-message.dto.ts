import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class AttachmentDto {
  @IsString()
  url!: string;

  @IsString()
  name!: string;

  @IsInt()
  size!: number;

  @IsString()
  mimeType!: string;
}

export class SendMessageDto {
  // 메시지를 전송할 채팅방 ID
  @IsString()
  roomId!: string;

  // 텍스트 메시지 내용 (파일만 전송할 경우 null일 수 있음)
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];
}
