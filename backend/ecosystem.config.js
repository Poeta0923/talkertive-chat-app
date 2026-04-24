/**
 * PM2 애플리케이션 설정
 *
 * 사용법:
 *   pnpm build                    # 먼저 빌드
 *   pm2 start ecosystem.config.js --env production
 *   pm2 logs talkertive-api       # 실시간 로그
 *   pm2 monit                     # CPU·메모리 모니터링
 *   pm2 save && pm2 startup       # 서버 재시작 시 자동 실행 등록
 */
module.exports = {
  apps: [
    {
      name: 'talkertive-api',
      script: './dist/main.js',

      // 인스턴스 수 — 'max'는 CPU 코어 수만큼 생성 (클러스터 모드)
      // 단, socket.io는 기본적으로 단일 인스턴스를 전제하므로
      // 스케일아웃 시 Redis Adapter 연동이 선행되어야 함
      instances: 1,
      exec_mode: 'fork',

      // 메모리가 500MB를 초과하면 자동으로 프로세스를 재시작
      max_memory_restart: '500M',

      // --- 로그 설정 ---
      // PM2가 자동으로 logs/ 디렉토리를 생성하고 파일을 관리함
      out_file: './logs/out.log',       // stdout (info, debug)
      error_file: './logs/error.log',   // stderr (error, warn)
      merge_logs: true,                 // 클러스터 모드 시 인스턴스별 로그를 하나로 합침
      log_date_format: 'YYYY-MM-DD HH:mm:ss',

      // --- 환경변수 ---
      env: {
        NODE_ENV: 'development',
        PORT: 8000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 8000,
      },
    },
  ],
};
