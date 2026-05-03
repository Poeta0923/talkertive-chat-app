import { auth } from '@/auth';
import { NextResponse } from 'next/server';

// jsonwebtoken은 Node.js 네이티브 모듈에 의존하므로 Edge 런타임에서 실행 불가
// Node.js 런타임을 명시해 미들웨어가 Edge 런타임으로 실행되지 않도록 강제
export const runtime = 'nodejs';

export default auth((req) => {
  // /admin 경로는 ADMIN 역할만 접근 허용
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!req.auth || req.auth.user.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }
});

// Auth.js 라우트(/api/auth/*)를 미들웨어에서 제외 — 미들웨어가 CSRF 쿠키를 덮어쓰는 것을 방지
// _next/static, _next/image, favicon 등 정적 파일에도 미들웨어를 실행하지 않음
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|health|api/auth).*)'],
};
