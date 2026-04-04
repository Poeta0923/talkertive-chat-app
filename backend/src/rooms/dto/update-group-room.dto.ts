import { PartialType } from '@nestjs/swagger';
import { CreateGroupRoomDto } from './create-group-room.dto';

export class UpdateGroupRoomDto extends PartialType(CreateGroupRoomDto) {}
