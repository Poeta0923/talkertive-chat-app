import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { RoomsModule } from './rooms/rooms.module';
import { RoomMembersModule } from './room-members/room-members.module';
import { ChatModule } from './chat/chat.module';
import { BannerModule } from './banner/banner.module';
import { MediaModule } from './media/media.module';
import { UsersModule } from './users/users.module';
import { SchedulesModule } from './schedules/schedules.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // isGlobal: true — 모든 모듈에서 ConfigModule을 별도 import 없이 환경변수 사용 가능
    ConfigModule.forRoot({ isGlobal: true }),
    // 전역 기본 제한: 10초 윈도우 내 20회 초과 시 429 반환
    // 인증 엔드포인트는 AuthController에서 @Throttle()로 별도 강화
    ThrottlerModule.forRoot([{ ttl: 10000, limit: 20 }]),
    AuthModule,
    PrismaModule,
    RoomsModule,
    RoomMembersModule,
    ChatModule,
    BannerModule,
    MediaModule,
    UsersModule,
    SchedulesModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // ThrottlerGuard를 전역 가드로 등록 — 모든 HTTP 엔드포인트에 자동 적용
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
