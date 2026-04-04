import { Module } from '@nestjs/common';
import { RoomMembersService } from './room-members.service';
import { RoomMembersController } from './room-members.controller';

@Module({
  controllers: [RoomMembersController],
  providers: [RoomMembersService],
})
export class RoomMembersModule {}
