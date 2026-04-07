import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

/**
 * WebSocket 전용 JWT 인증 가드.
 *
 * HTTP 요청과 달리 WebSocket 연결은 Passport 미들웨어를 거치지 않는다.
 * 때문에 HTTP 가드(AccessTokenGuard)를 WebSocket에 그대로 쓸 수 없고,
 * 직접 소켓 핸드셰이크의 토큰을 꺼내 검증해야 한다.
 *
 * 클라이언트는 연결 시 아래 두 가지 방법 중 하나로 토큰을 전달한다:
 *   1. handshake.auth.token  — socket.io 권장 방식
 *   2. handshake.headers.authorization  — "Bearer <token>" 형식
 */
@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    // ExecutionContext에서 WebSocket 소켓 객체를 꺼낸다
    const client: Socket = context.switchToWs().getClient();

    const token = this.extractToken(client);

    if (!token) {
      // WebSocket 에러는 WsException을 사용해야 socket.io가 'exception' 이벤트로 전달한다
      throw new WsException('인증 토큰이 없습니다.');
    }

    try {
      // NextAuth와 동일한 AUTH_SECRET으로 서명 검증
      const payload = this.jwtService.verify(token, {
        secret: process.env.AUTH_SECRET,
      });

      // 검증된 payload를 소켓 데이터에 저장해 Gateway에서 꺼내 쓸 수 있게 한다
      // socket.data는 socket.io가 소켓 인스턴스마다 제공하는 커스텀 저장 공간이다
      client.data.user = payload;
      return true;
    } catch {
      throw new WsException('유효하지 않은 토큰입니다.');
    }
  }

  private extractToken(client: Socket): string | undefined {
    // 방법 1: socket.io auth 옵션으로 전달된 토큰
    const authToken = client.handshake.auth?.token as string | undefined;
    if (authToken) return authToken;

    // 방법 2: Authorization 헤더에서 "Bearer <token>" 형식으로 전달된 토큰
    const authHeader = client.handshake.headers?.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    return undefined;
  }
}
