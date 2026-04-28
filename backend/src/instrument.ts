import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

// 반드시 다른 모든 import보다 먼저 실행되어야 함
// Sentry가 Node.js 내장 모듈을 감싸 에러·성능을 추적하므로,
// 다른 모듈이 먼저 로드되면 계측이 누락됨
Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // 프로파일링: 느린 요청의 CPU 사용 스택트레이스를 Sentry에 기록
  integrations: [nodeProfilingIntegration()],

  // 트랜잭션(요청)의 10%를 성능 모니터링 대상으로 샘플링
  tracesSampleRate: 0.1,
  profilesSampleRate: 0.1,

  // 개발 환경에서는 Sentry로 전송하지 않음 — 노이즈 방지
  enabled: process.env.NODE_ENV === 'production',
});
