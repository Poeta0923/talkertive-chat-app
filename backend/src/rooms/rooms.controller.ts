import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { RoomsService } from './rooms.service';
import { CreateGroupRoomDto } from './dto/create-group-room.dto';
import { CreateDirectRoomDto } from './dto/create-direct-room.dto';
import { UpdateGroupRoomDto } from './dto/update-group-room.dto';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import type { Request } from 'express';

@ApiTags('rooms')
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post('group')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'GROUP 모임 채팅방 생성' })
  @ApiCreatedResponse({ description: '생성된 GROUP 채팅방 정보' })
  createGroupRoom(@Req() req: Request, @Body() dto: CreateGroupRoomDto) {
    const userId = (req.user as { sub: string }).sub;
    return this.roomsService.createGroupRoom(userId, dto);
  }

  @Post('direct')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '1대1 DIRECT 채팅방 생성' })
  @ApiCreatedResponse({ description: '생성된 DIRECT 채팅방 정보' })
  createDirectRoom(@Req() req: Request, @Body() dto: CreateDirectRoomDto) {
    const userId = (req.user as { sub: string }).sub;
    return this.roomsService.createDirectRoom(userId, dto);
  }

  @Patch('group/:roomId')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'GROUP 모임 채팅방 수정 (OWNER 전용)' })
  @ApiOkResponse({ description: '수정된 GROUP 채팅방 정보' })
  updateGroupRoom(
    @Req() req: Request,
    @Param('roomId') roomId: string,
    @Body() dto: UpdateGroupRoomDto,
  ) {
    const userId = (req.user as { sub: string }).sub;
    return this.roomsService.updateGroupRoom(userId, roomId, dto);
  }

  @Get('group')
  @ApiOperation({ summary: 'GROUP 모임 채팅방 목록 조회 (date 오름차순)' })
  @ApiOkResponse({ description: 'date가 현재 이후인 GROUP 채팅방 목록' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'cursor', required: false, type: String, description: '마지막 항목의 roomId' })
  findAllGroupRooms(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.roomsService.findAllGroupRooms({
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
      cursor: cursor ? { id: cursor } : undefined,
    });
  }

  @Get('group/:roomId')
  @ApiOperation({ summary: 'GROUP 모임 채팅방 단건 조회 (OWNER 정보 포함)' })
  @ApiOkResponse({ description: 'OWNER 유저 정보가 포함된 GROUP 채팅방' })
  findOneGroupRoom(@Param('roomId') roomId: string) {
    return this.roomsService.findOneGroupRoom(roomId);
  }

  @Get('direct')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '내가 참여 중인 DIRECT 채팅방 목록 조회' })
  @ApiOkResponse({ description: '상대방 유저 정보가 포함된 DIRECT 채팅방 목록' })
  findAllDirectRooms(@Req() req: Request) {
    const userId = (req.user as { sub: string }).sub;
    return this.roomsService.findAllDirectRooms(userId);
  }

  @Get('direct/:roomId')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '내가 참여 중인 DIRECT 채팅방 단건 조회 (상대방 정보 포함)' })
  @ApiOkResponse({ description: '상대방 유저 정보가 포함된 DIRECT 채팅방' })
  findOneDirectRoom(@Req() req: Request, @Param('roomId') roomId: string) {
    const userId = (req.user as { sub: string }).sub;
    return this.roomsService.findOneDirectRoom(userId, roomId);
  }

  @Delete('group/:roomId')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'GROUP 모임 채팅방 삭제 (OWNER 전용)' })
  @ApiOkResponse({ description: '채팅방 삭제 완료' })
  deleteGroupRoom(@Req() req: Request, @Param('roomId') roomId: string) {
    const userId = (req.user as { sub: string }).sub;
    return this.roomsService.deleteGroupRoom(userId, roomId);
  }

  @Delete('direct/:roomId')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'DIRECT 채팅방 삭제 (참가자 전용)' })
  @ApiOkResponse({ description: '채팅방 삭제 완료' })
  deleteDirectRoom(@Req() req: Request, @Param('roomId') roomId: string) {
    const userId = (req.user as { sub: string }).sub;
    return this.roomsService.deleteDirectRoom(userId, roomId);
  }
}
