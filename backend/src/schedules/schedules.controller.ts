import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { SchedulesService } from './schedules.service';
import { AiScheduleRequestDto } from './dto/ai-schedule-request.dto';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { RoomSchedule as RoomScheduleEntity } from '../_gen/prisma-class/room_schedule';
import type { Request } from 'express';

@ApiTags('schedules')
@Controller('schedules')
@UseGuards(AccessTokenGuard)
@ApiBearerAuth('access-token')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  @ApiOperation({ summary: '내가 소속된 GROUP 방의 모든 일정 조회' })
  @ApiOkResponse({ description: '일정 목록 (time 오름차순)', type: RoomScheduleEntity, isArray: true })
  findMySchedules(@Req() req: Request) {
    const userId = (req.user as { sub: string }).sub;
    return this.schedulesService.findMySchedules(userId);
  }

  @Get(':roomId')
  @ApiOperation({ summary: '특정 GROUP 방의 일정 목록 조회' })
  @ApiParam({ name: 'roomId', description: '대상 GROUP 방 ID' })
  @ApiOkResponse({ description: '일정 목록 (time 오름차순)', type: RoomScheduleEntity, isArray: true })
  findRoomSchedules(@Param('roomId') roomId: string) {
    return this.schedulesService.findRoomSchedules(roomId);
  }

  @Post(':roomId')
  @ApiOperation({ summary: '일정 추가 (OWNER 전용)' })
  @ApiParam({ name: 'roomId', description: '대상 GROUP 방 ID' })
  @ApiCreatedResponse({ description: '생성된 일정', type: RoomScheduleEntity })
  createSchedule(
    @Req() req: Request,
    @Param('roomId') roomId: string,
    @Body() dto: CreateScheduleDto,
  ) {
    const userId = (req.user as { sub: string }).sub;
    return this.schedulesService.createSchedule(userId, roomId, dto);
  }

  @Patch(':roomId/:scheduleId')
  @ApiOperation({ summary: '일정 수정 (OWNER 전용)' })
  @ApiParam({ name: 'roomId', description: '대상 GROUP 방 ID' })
  @ApiParam({ name: 'scheduleId', description: '수정할 일정 ID' })
  @ApiOkResponse({ description: '수정된 일정', type: RoomScheduleEntity })
  updateSchedule(
    @Req() req: Request,
    @Param('roomId') roomId: string,
    @Param('scheduleId') scheduleId: string,
    @Body() dto: UpdateScheduleDto,
  ) {
    const userId = (req.user as { sub: string }).sub;
    return this.schedulesService.updateSchedule(userId, roomId, scheduleId, dto);
  }

  @Delete(':roomId/:scheduleId')
  @ApiOperation({ summary: '일정 삭제 (OWNER 전용)' })
  @ApiParam({ name: 'roomId', description: '대상 GROUP 방 ID' })
  @ApiParam({ name: 'scheduleId', description: '삭제할 일정 ID' })
  @ApiNoContentResponse({ description: '일정 삭제 완료' })
  deleteSchedule(
    @Req() req: Request,
    @Param('roomId') roomId: string,
    @Param('scheduleId') scheduleId: string,
  ) {
    const userId = (req.user as { sub: string }).sub;
    return this.schedulesService.deleteSchedule(userId, roomId, scheduleId);
  }

  @Post(':roomId/ai')
  @ApiOperation({ summary: 'AI로 일정 추가/변경/취소 (OWNER 전용)' })
  @ApiParam({ name: 'roomId', description: '대상 GROUP 방 ID' })
  @ApiOkResponse({ description: 'AI가 처리한 결과 일정', type: RoomScheduleEntity })
  processAiSchedule(
    @Req() req: Request,
    @Param('roomId') roomId: string,
    @Body() dto: AiScheduleRequestDto,
  ) {
    const userId = (req.user as { sub: string }).sub;
    return this.schedulesService.processAiSchedule(userId, roomId, dto);
  }
}
