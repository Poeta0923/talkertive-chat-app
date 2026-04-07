import { IsString } from 'class-validator';

export class ReadMessageDto {
  // 읽음 처리 기준이 될 채팅방 ID
  @IsString()
  roomId: string;

  // 마지막으로 읽은 메시지 ID — 이 메시지 이전의 모든 메시지를 읽음 처리한다
  @IsString()
  lastMessageId: string;
}
