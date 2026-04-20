import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';

export enum ActionType {
  ADD = '일정 추가',
  UPDATE = '일정 변경',
  CANCEL = '일정 취소',
}

export class AiScheduleRequestDto {
  @ApiProperty({ enum: ActionType, description: '수행할 액션 타입' })
  @IsEnum(ActionType)
  actionType: ActionType;

  @ApiProperty({ description: '사용자의 자연어 요청 (한국어)', example: '다음 주 월요일 오후 3시에 정기 모임 추가해줘' })
  @IsString()
  userRequest: string;
}
