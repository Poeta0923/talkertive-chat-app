import { getSessionToken } from '@/lib/session-token';

// WebSocket 연결 시 클라이언트가 세션 토큰을 가져가기 위한 엔드포인트
// httpOnly 쿠키는 JS에서 직접 읽을 수 없으므로 서버를 통해 전달한다
export async function GET() {
  const token = await getSessionToken();
  if (!token) return Response.json(null, { status: 401 });

  return Response.json({ token });
}
