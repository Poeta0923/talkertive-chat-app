import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { WsJwtGuard } from './ws-jwt.guard';

@Module({
  imports: [
    // WsJwtGuard와 ChatGateway에서 JwtService를 주입받기 위해 등록한다.
    // 토큰 발급은 NextAuth가 담당하므로 secret 없이 빈 설정으로 등록하고,
    // 검증 시점에 process.env.AUTH_SECRET을 직접 넘긴다.
    JwtModule.register({}),
  ],
  providers: [ChatGateway, ChatService, WsJwtGuard],
})
export class ChatModule {}
