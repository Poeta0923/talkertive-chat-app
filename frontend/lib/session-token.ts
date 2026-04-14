'use server';

import { cookies } from 'next/headers';

/**
 * NextAuth JWT 세션 토큰을 쿠키에서 꺼낸다.
 * HTTP 환경은 'authjs.session-token', HTTPS 환경은 '__Secure-' 접두사가 붙는다.
 */
export async function getSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return (
    cookieStore.get('authjs.session-token')?.value ??
    cookieStore.get('__Secure-authjs.session-token')?.value
  );
}
