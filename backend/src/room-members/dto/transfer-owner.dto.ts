import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class TransferOwnerDto {
  @ApiProperty({ description: 'OWNER 권한을 넘겨줄 대상 유저 ID' })
  @IsString()
  targetUserId: string;
}
