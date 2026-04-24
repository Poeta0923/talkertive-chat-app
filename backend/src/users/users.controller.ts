import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { User as UserEntity } from '../_gen/prisma-class/user';
import type { Request } from 'express';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '내 정보 조회' })
  @ApiOkResponse({
    description: '내 유저 정보 (hashedPassword 제외)',
    type: UserEntity,
  })
  getMe(@Req() req: Request) {
    const userId = (req.user as { sub: string }).sub;
    return this.usersService.getMe(userId);
  }

  @Patch(':userId')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '유저 정보 수정 (본인만 가능)' })
  @ApiOkResponse({
    description: '수정된 유저 정보 (hashedPassword 제외)',
    type: UserEntity,
  })
  updateMe(
    @Req() req: Request,
    @Param('userId') userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    const requesterId = (req.user as { sub: string }).sub;
    return this.usersService.updateMe(requesterId, userId, dto);
  }
}
