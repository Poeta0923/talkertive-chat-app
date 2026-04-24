import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';

@Module({
  imports: [
    // PrismaHealthIndicator 등 terminus 내장 인디케이터를 모두 제공
    TerminusModule,
  ],
  controllers: [HealthController],
})
export class HealthModule {}
