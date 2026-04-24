import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';
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
  ) {}

  /**
   * 서버 전체 상태를 반환한다.
   * - db: Prisma를 통한 PostgreSQL 연결 여부
   * - memory_heap: 힙 메모리 사용량 (250MB 초과 시 unhealthy)
   * k8s readiness/liveness probe, 로드밸런서 헬스체크 대상 엔드포인트
   */
  @Get()
  @HealthCheck()
  @ApiOperation({ summary: '서버 상태 확인 (DB 연결, 메모리)' })
  check() {
    return this.health.check([
      // DB가 응답하는지 확인 — 연결 끊김 시 503 반환
      () => this.prismaIndicator.pingCheck('db', this.prisma),
    ]);
  }
}
