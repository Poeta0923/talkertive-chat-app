import {
  utilities as nestWinstonUtilities,
  WinstonModuleOptions,
} from 'nest-winston';
import * as winston from 'winston';
import { RequestContext } from '../request-context';

/**
 * 모든 로그 항목에 requestId를 자동으로 주입하는 커스텀 포맷
 * AsyncLocalStorage에서 꺼내므로 파라미터 전달 없이 어디서든 포함됨
 */
const injectRequestId = winston.format((info) => {
  const requestId = RequestContext.getRequestId();
  if (requestId) {
    info.requestId = requestId;
  }
  return info;
});

/**
 * 개발 환경: 컬러 + 사람이 읽기 편한 텍스트 포맷
 * 프로덕션: JSON 포맷 — CloudWatch, Datadog, ELK 등 로그 수집기가 자동 파싱
 */
export function createWinstonOptions(appName: string): WinstonModuleOptions {
  const isProd = process.env.NODE_ENV === 'production';

  const productionFormat = winston.format.combine(
    injectRequestId(),
    winston.format.timestamp(),
    winston.format.json(),
  );

  const developmentFormat = winston.format.combine(
    injectRequestId(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    nestWinstonUtilities.format.nestLike(appName, {
      prettyPrint: true,
      colors: true,
    }),
  );

  return {
    transports: [
      new winston.transports.Console({
        level: isProd ? 'info' : 'debug',
        format: isProd ? productionFormat : developmentFormat,
      }),
    ],
  };
}
