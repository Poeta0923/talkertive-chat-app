'use server';

import type { Room } from '@/generated/openapi-client';
import { getSessionToken } from '@/lib/session-token';
import { cache } from 'react';

type MyRoom = Room & { myRole?: string };

/**
 * 내가 참여 중인 모든 방 목록을 가져온다.
 * React cache()로 감싸 동일 렌더링 사이클 내 중복 호출을 방지한다.
 */
export const getMyRooms = cache(async (): Promise<MyRoom[]> => {
  const token = await getSessionToken();
  if (!token) return [];

  const res = await fetch(`${process.env.API_URL ?? 'http://localhost:8000'}/rooms/my`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!res.ok) return [];
  return res.json();
});
