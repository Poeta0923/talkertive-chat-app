import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // transform: true — 요청 데이터를 DTO 타입에 맞게 자동 변환 (string → number 등)
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // 개발 환경에서 프론트엔드(3000)와 Swagger(8000)의 cross-origin 요청 허용
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : true,
    credentials: true,
  });

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

  await app.listen(process.env.PORT ?? 8000);
}
bootstrap();
