import { Body, Controller, Delete, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RoomMembersService } from './room-members.service';
import { InviteMemberDto } from './dto/invite-member.dto';
import { TransferOwnerDto } from './dto/transfer-owner.dto';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { RoomMember as RoomMemberEntity } from '../_gen/prisma-class/room_member';
import type { Request } from 'express';

@ApiTags('room-members')
@Controller('room-members')
@UseGuards(AccessTokenGuard)
@ApiBearerAuth('access-token')
export class RoomMembersController {
  constructor(private readonly roomMembersService: RoomMembersService) {}

  @Post(':roomId/invite')
  @ApiOperation({ summary: 'GROUP 채팅방에 유저 초대 (OWNER 전용)' })
  @ApiCreatedResponse({ description: '초대된 멤버 정보', type: RoomMemberEntity })
  inviteMember(
    @Req() req: Request,
    @Param('roomId') roomId: string,
    @Body() dto: InviteMemberDto,
  ) {
    const requesterId = (req.user as { sub: string }).sub;
    return this.roomMembersService.inviteMember(requesterId, roomId, dto);
  }

  @Delete(':roomId/members/:targetUserId')
  @ApiOperation({ summary: '채팅방에서 멤버 내보내기 (OWNER 또는 본인)' })
  @ApiOkResponse({ description: '내보내진 멤버 정보', type: RoomMemberEntity })
  removeMember(
    @Req() req: Request,
    @Param('roomId') roomId: string,
    @Param('targetUserId') targetUserId: string,
  ) {
    const requesterId = (req.user as { sub: string }).sub;
    return this.roomMembersService.removeMember(requesterId, roomId, targetUserId);
  }

  @Patch(':roomId/transfer-owner')
  @ApiOperation({ summary: 'OWNER 권한 이전 (OWNER 전용) — 기존 OWNER는 MEMBER로 강등' })
  @ApiOkResponse({ description: '새 OWNER의 멤버 정보', type: RoomMemberEntity })
  transferOwner(
    @Req() req: Request,
    @Param('roomId') roomId: string,
    @Body() dto: TransferOwnerDto,
  ) {
    const requesterId = (req.user as { sub: string }).sub;
    return this.roomMembersService.transferOwner(requesterId, roomId, dto);
  }
}
