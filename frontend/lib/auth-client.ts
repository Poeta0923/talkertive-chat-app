'use client';

/**
 * httpOnly 쿠키는 JS에서 직접 읽을 수 없으므로 Route Handler를 통해 토큰을 가져온다.
 * null 반환 시 인증 실패 또는 미로그인 상태다.
 */
export async function getAuthToken(): Promise<string | null> {
  const res = await fetch('/api/auth/token');
  if (!res.ok) return null;
  const data = (await res.json()) as { token: string };
  return data.token ?? null;
}
