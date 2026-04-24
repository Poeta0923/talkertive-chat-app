import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { RequestContext } from '../request-context';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // 업스트림(API 게이트웨이, 프론트엔드)에서 ID를 전달하면 재사용하고, 없으면 생성
    const requestId = (req.headers['x-request-id'] as string) ?? uuidv4();

    // 클라이언트가 응답 헤더에서 requestId를 확인할 수 있도록 반환
    res.setHeader('X-Request-Id', requestId);

    // 이 블록 안의 모든 비동기 호출(가드·서비스·레포지토리)이 같은 requestId를 공유
    RequestContext.run(requestId, () => next());
  }
}
