'use server';

import { getSessionToken } from '@/lib/session-token';

const API_URL = process.env.API_URL ?? 'http://localhost:8000';

/**
 * DIRECT 채팅방을 생성하거나 이미 존재하면 기존 방 ID를 반환한다.
 * redirect 대신 roomId를 반환해 클라이언트가 사이드바 atom을 직접 제어할 수 있게 한다.
 */
export async function createOrFindDirectRoom(targetUserId: string): Promise<string | null> {
  const token = await getSessionToken();
  if (!token) return null;

  const res = await fetch(`${API_URL}/rooms/direct`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ targetUserId }),
  });

  if (res.ok) {
    const data = (await res.json()) as { id: string };
    return data.id;
  }

  // 이미 존재하는 채팅방이면 내 채팅 목록에서 해당 방을 찾아 ID를 반환한다
  if (res.status === 409) {
    const myRoomsRes = await fetch(`${API_URL}/rooms/my`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (myRoomsRes.ok) {
      const rooms = (await myRoomsRes.json()) as {
        id: string;
        type: string;
        members: { userId: string }[];
      }[];
      const existing = rooms.find(
        (r) => r.type === 'DIRECT' && r.members.some((m) => m.userId === targetUserId),
      );
      return existing?.id ?? null;
    }
  }

  return null;
}
