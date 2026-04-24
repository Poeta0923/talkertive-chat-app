import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // WinstonModule이 준비되기 전 발생하는 로그를 버퍼에 쌓았다가 useLogger 이후 일괄 출력
    bufferLogs: true,
  });

  // NestJS 내장 Logger를 Winston으로 교체
  // 이후 new Logger('Context')로 찍히는 모든 로그가 Winston을 통해 출력됨
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // Graceful Shutdown — SIGTERM 수신 시 진행 중인 요청을 완료하고 종료 (Docker·k8s 필수 패턴)
  app.enableShutdownHooks();

  // XSS, 클릭재킹, MIME 스니핑 등 브라우저 수준 공격을 차단하는 보안 헤더 일괄 적용
  // Swagger UI가 inline 스크립트를 사용하므로 개발 환경에서는 CSP를 비활성화
  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production',
    }),
  );

  // transform: true — 요청 데이터를 DTO 타입에 맞게 자동 변환 (string → number 등)
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // 개발 환경에서 프론트엔드(3000)와 Swagger(8000)의 cross-origin 요청 허용
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : true,
    credentials: true,
  });

  // Swagger는 개발 환경에서만 활성화 — 프로덕션에서 API 구조 노출 방지
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Talkertive API')
      .setDescription('Talkertive API 문서입니다.')
      .setVersion('1.0')
      // @ApiBearerAuth('access-token') 데코레이터와 이름을 맞춰야 Swagger UI에서 인증이 연동됨
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'access-token',
          description: 'Enter access token',
          in: 'header',
        },
        'access-token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  await app.listen(process.env.PORT ?? 8000);
}
bootstrap();
