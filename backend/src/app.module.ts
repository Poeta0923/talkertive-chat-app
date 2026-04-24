import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { WinstonModule } from 'nest-winston';
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
import { createWinstonOptions } from './common/logger/winston.config';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { HttpLoggingMiddleware } from './common/middleware/http-logging.middleware';

@Module({
  imports: [
    // isGlobal: true — 모든 모듈에서 ConfigModule을 별도 import 없이 환경변수 사용 가능
    ConfigModule.forRoot({ isGlobal: true }),
    // instrument.ts에서 Sentry.init()이 선행된 후 NestJS 계측 연결
    SentryModule.forRoot(),
    // nest-winston 1.5+ 이상은 모듈 자체가 @Global()로 선언되어 있어 별도 설정 불필요
    WinstonModule.forRoot(createWinstonOptions('Talkertive')),
    // 전역 기본 제한: 10초 윈도우 내 20회 초과 시 429 반환
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
    // NestJS 예외 필터가 에러를 삼키므로 Sentry가 자동 감지 못함 — 전역 필터로 직접 전달
    { provide: APP_FILTER, useClass: SentryGlobalFilter },
    // ThrottlerGuard를 전역 가드로 등록 — 모든 HTTP 엔드포인트에 자동 적용
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        RequestIdMiddleware,   // 1순위: UUID 생성 → AsyncLocalStorage 저장
        HttpLoggingMiddleware, // 2순위: requestId가 이미 컨텍스트에 있으므로 로그에 자동 포함
      )
      .forRoutes('*'); // 모든 라우트에 적용
  }
}
