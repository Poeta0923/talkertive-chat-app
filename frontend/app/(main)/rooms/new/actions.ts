'use server';

import { getSessionToken } from '@/lib/session-token';
import type { CreateGroupRoomDto } from '@/generated/openapi-client';

const API_URL = process.env.API_URL ?? 'http://localhost:8000';

export async function createGroupRoom(body: CreateGroupRoomDto): Promise<string> {
  const token = await getSessionToken();
  const res = await fetch(`${API_URL}/rooms/group`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error('모임 생성에 실패했습니다.');
  const data = (await res.json()) as { id: string };
  return data.id;
}

export async function uploadRoomCover(roomId: string, formData: FormData) {
  const token = await getSessionToken();
  const res = await fetch(`${API_URL}/media/rooms/${roomId}/cover`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) throw new Error('이미지 업로드에 실패했습니다.');
  const data = (await res.json()) as { coverImage: string };
  return data.coverImage;
}

export async function uploadRoomProfile(roomId: string, formData: FormData) {
  const token = await getSessionToken();
  const res = await fetch(`${API_URL}/media/rooms/${roomId}/profile`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) throw new Error('이미지 업로드에 실패했습니다.');
  const data = (await res.json()) as { profileImage: string };
  return data.profileImage;
}
