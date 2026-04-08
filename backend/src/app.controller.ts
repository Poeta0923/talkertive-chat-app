import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { AccessTokenGuard } from './auth/guards/access-token.guard';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('user-test')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth('access-token')
  @ApiOkResponse({description: '유저 테스트', type: String})
  testUser(@Req() req: Request){
    console.log(req.user);
    return `유저 이메일: ${req.user?.email}`
  }
}