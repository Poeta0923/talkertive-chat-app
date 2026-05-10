import { Injectable, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from 'generated/prisma';
import { getOrCreateHistogram } from '../metrics/metrics.helper';

@Injectable()
export class PrismaService
  extends PrismaClient<Prisma.PrismaClientOptions, 'query'>
  implements OnModuleInit
{
  constructor() {
    super({ log: [{ emit: 'event', level: 'query' }] });
  }

  async onModuleInit() {
    await this.$connect();

    const histogram = getOrCreateHistogram({
      name: 'prisma_query_duration_seconds',
      help: 'Prisma DB 쿼리 소요 시간 (초)',
      labelNames: ['target'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2],
    });

    this.$on('query', (event) => {
      histogram.observe({ target: event.target }, event.duration / 1000);
    });
  }
}
