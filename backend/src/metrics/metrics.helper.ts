import { Counter, Histogram, register } from 'prom-client';

interface HistogramConfig {
  name: string;
  help: string;
  labelNames: string[];
  buckets: number[];
}

interface CounterConfig {
  name: string;
  help: string;
  labelNames: string[];
}

// watch 모드 hot-reload 시 중복 등록 방지 — 이미 등록된 메트릭이 있으면 재사용
export function getOrCreateHistogram(config: HistogramConfig): Histogram {
  return (
    (register.getSingleMetric(config.name) as Histogram) ??
    new Histogram({
      name: config.name,
      help: config.help,
      labelNames: config.labelNames,
      buckets: config.buckets,
    })
  );
}

export function getOrCreateCounter(config: CounterConfig): Counter {
  return (
    (register.getSingleMetric(config.name) as Counter) ??
    new Counter({
      name: config.name,
      help: config.help,
      labelNames: config.labelNames,
    })
  );
}
