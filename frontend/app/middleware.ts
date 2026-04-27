import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  // /admin 경로는 ADMIN 역할만 접근 허용
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!req.auth || req.auth.user.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }
});
