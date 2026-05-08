import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  HealthIndicatorResult,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';

// 헬스체크는 로드밸런서·k8s가 반복 호출하므로 throttle 대상에서 제외
@SkipThrottle()
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaIndicator: PrismaHealthIndicator,
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  /**
   * 서버 전체 상태를 반환한다.
   * - db: Prisma를 통한 PostgreSQL 연결 여부
   * - redis: set/get 왕복으로 Redis 연결 여부 확인
   * k8s readiness/liveness probe, 로드밸런서 헬스체크 대상 엔드포인트
   */
  @Get()
  @HealthCheck()
  @ApiOperation({ summary: '서버 상태 확인 (DB 연결, Redis 연결)' })
  check() {
    return this.health.check([
      // DB가 응답하는지 확인 — 연결 끊김 시 503 반환
      () => this.prismaIndicator.pingCheck('db', this.prisma),
      // Redis set/get 왕복으로 캐시 연결 상태 확인
      () => this.checkRedis(),
    ]);
  }

  private async checkRedis(): Promise<HealthIndicatorResult> {
    const PROBE_KEY = 'health:ping';
    // Redis는 캐싱 용도라 장애여도 앱은 DB로 fallback되어 동작한다
    // ALB가 503으로 Task를 죽이지 않도록 Redis 상태는 항상 up으로 반환하고
    // 실제 상태는 message로 노출한다 (CloudWatch 로그/모니터링에서 추적)
    // ElastiCache TLS hang 방지로 3초 타임아웃 적용
    const TIMEOUT_MS = 3_000;
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Redis health check timeout')), TIMEOUT_MS),
    );

    try {
      await Promise.race([
        (async () => {
          await this.cache.set(PROBE_KEY, '1', 5_000);
          const val = await this.cache.get(PROBE_KEY);
          if (val !== '1') throw new Error('Redis read-back mismatch');
          await this.cache.del(PROBE_KEY);
        })(),
        timeout,
      ]);
      return { redis: { status: 'up' } };
    } catch (err) {
      return {
        redis: { status: 'up', degraded: true, message: (err as Error).message },
      };
    }
  }
}
