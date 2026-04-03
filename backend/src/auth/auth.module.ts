import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AccessTokenStrategy } from './strategies/access-token.strategy';

// JwtModule은 설정 없이 등록 — 토큰 발급은 NextAuth가 담당하고 백엔드는 검증만 수행
@Module({
  imports: [PassportModule, JwtModule.register({})],
  providers: [AccessTokenStrategy],
})
export class AuthModule {}
