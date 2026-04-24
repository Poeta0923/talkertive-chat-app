import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

type JwtPayload = {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
  iat?: number;
};

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-access-token',
) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // 프론트엔드 NextAuth와 동일한 시크릿으로 서명된 토큰을 검증
      secretOrKey: process.env.AUTH_SECRET as string,
    });
  }

  // 검증된 payload는 req.user에 자동으로 주입됨
  validate(payload: JwtPayload) {
    return payload;
  }
}
