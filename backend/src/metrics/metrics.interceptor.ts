import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Histogram, register } from 'prom-client';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

const BUCKETS = [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

// watch 모드 hot-reload 시 중복 등록 방지 — 이미 등록된 메트릭이 있으면 재사용
function getOrCreateHistogram(name: string, help: string): Histogram {
  return (register.getSingleMetric(name) as Histogram) ?? new Histogram({ name, help, labelNames: ['controller', 'handler', 'method'], buckets: BUCKETS });
}

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  private readonly successHistogram = getOrCreateHistogram('nestjs_success_requests', 'NestJS 성공 요청 응답시간 (초)');
  private readonly failHistogram = getOrCreateHistogram('nestjs_fail_requests', 'NestJS 실패 요청 응답시간 (초)');

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
