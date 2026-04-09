import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { RoomsModule } from './rooms/rooms.module';
import { RoomMembersModule } from './room-members/room-members.module';
import { ChatModule } from './chat/chat.module';
import { BannerModule } from './banner/banner.module';
import { MediaModule } from './media/media.module';

@Module({
  // isGlobal: true — 모든 모듈에서 ConfigModule을 별도 import 없이 환경변수 사용 가능
  imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule, PrismaModule, RoomsModule, RoomMembersModule, ChatModule, BannerModule, MediaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
