import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class HttpLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;
    const startAt = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const elapsed = Date.now() - startAt;
      const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'log';

      // 로그 수집기에서 필드 기준으로 필터·집계할 수 있도록 구조화된 객체로 기록
      this.logger[level]({ method, url: originalUrl, statusCode, elapsed: `${elapsed}ms` });
    });

    next();
  }
}
