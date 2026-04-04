import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class InviteMemberDto {
  @ApiProperty({ description: '초대할 유저 ID' })
  @IsString()
  targetUserId: string;
}
