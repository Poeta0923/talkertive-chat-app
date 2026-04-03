import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { AccessTokenGuard } from './auth/guard/access-token.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // TODO: AccessTokenGuard 동작 확인용 임시 엔드포인트 — 검증 후 제거
  @Get('user-test')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth('access-token')
  testUser(@Req() req: Request) {
    console.log(req.user);
    return 'test completed';
  }
}
