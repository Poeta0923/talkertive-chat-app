import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { getOrCreateHistogram } from './metrics.helper';

const BUCKETS = [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  private readonly successHistogram = getOrCreateHistogram({
    name: 'nestjs_success_requests',
    help: 'NestJS 성공 요청 응답시간 (초)',
    labelNames: ['controller', 'handler', 'method'],
    buckets: BUCKETS,
  });
  private readonly failHistogram = getOrCreateHistogram({
    name: 'nestjs_fail_requests',
    help: 'NestJS 실패 요청 응답시간 (초)',
    labelNames: ['controller', 'handler', 'method'],
    buckets: BUCKETS,
  });

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{ url: string; method: string }>();

    // /metrics 자기 참조 요청은 수집 제외
    if (request.url.includes('/metrics')) {
      return next.handle();
    }

    const labels = {
      controller: context.getClass().name,
      handler: context.getHandler().name,
      method: request.method,
    };

    const successTimer = this.successHistogram.startTimer(labels);
    const failTimer = this.failHistogram.startTimer(labels);

    return next.handle().pipe(
      tap(() => successTimer()),
      catchError((err) => {
        failTimer();
        throw err;
      }),
    );
  }
}
