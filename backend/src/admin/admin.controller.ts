import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminUserQueryDto } from './dto/admin-user-query.dto';
import { AdminRoomQueryDto } from './dto/admin-room-query.dto';
import { RoomCategory, RoomType } from 'generated/prisma';

@ApiTags('admin')
@Controller('admin')
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth('access-token')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ─── 통계 ─────────────────────────────────────────────────────────────────

  @Get('stats/users')
  @ApiOperation({ summary: '유저 통계 (ADMIN 전용)' })
  @ApiOkResponse({ description: '전체/신규 유저 수, 최근 30일 가입 추이, 소셜 비율' })
  getUserStats() {
    return this.adminService.getUserStats();
  }

  @Get('stats/rooms')
  @ApiOperation({ summary: '모임 통계 (ADMIN 전용)' })
  @ApiOkResponse({ description: '전체 모임 수, 카테고리별 분포, 최근 30일 생성 추이' })
  getRoomStats() {
    return this.adminService.getRoomStats();
  }

  @Get('stats/schedules')
  @ApiOperation({ summary: '일정 통계 (ADMIN 전용)' })
  @ApiOkResponse({ description: '전체/이번달 일정 수, 최근 30일 일정 날짜(time) 기준 추이' })
  getScheduleStats() {
    return this.adminService.getScheduleStats();
  }

  // ─── 유저 관리 ───────────────────────────────────────────────────────────

  @Get('users')
  @ApiOperation({ summary: '유저 목록 조회 (ADMIN 전용)' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'role', required: false, type: String })
  @ApiOkResponse({ description: '유저 목록 및 전체 수' })
  findAllUsers(@Query() query: AdminUserQueryDto) {
    return this.adminService.findAllUsers(query);
  }

  @Get('users/:id')
  @ApiOperation({ summary: '유저 상세 조회 (ADMIN 전용)' })
  @ApiOkResponse({ description: '유저 기본 정보 + 주관 모임 + 참가 모임 목록' })
  findOneUser(@Param('id') id: string) {
    return this.adminService.findOneUser(id);
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '유저 강제 탈퇴 (ADMIN 전용)' })
  @ApiNoContentResponse({ description: '삭제 완료' })
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  // ─── 모임 관리 ───────────────────────────────────────────────────────────

  @Get('rooms')
  @ApiOperation({ summary: '모임 목록 조회 (ADMIN 전용)' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, enum: RoomCategory })
  @ApiQuery({ name: 'type', required: false, enum: RoomType })
  @ApiOkResponse({ description: '모임 목록 및 전체 수' })
  findAllRooms(@Query() query: AdminRoomQueryDto) {
    return this.adminService.findAllRooms(query);
  }

  @Get('rooms/:id')
  @ApiOperation({ summary: '모임 상세 조회 (ADMIN 전용)' })
  @ApiOkResponse({ description: '모임 정보 + 멤버 목록 + 일정 목록' })
  findOneRoom(@Param('id') id: string) {
    return this.adminService.findOneRoom(id);
  }

  @Delete('rooms/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '모임 강제 삭제 (ADMIN 전용)' })
  @ApiNoContentResponse({ description: '삭제 완료' })
  deleteRoom(@Param('id') id: string) {
    return this.adminService.deleteRoom(id);
  }
}
