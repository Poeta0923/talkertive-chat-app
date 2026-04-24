'use server';

import { getSessionToken } from '@/lib/session-token';
import type { UpdateGroupRoomDto } from '@/generated/openapi-client';

const API_URL = process.env.API_URL ?? 'http://localhost:8000';

export async function updateGroupRoom(roomId: string, body: UpdateGroupRoomDto) {
  const token = await getSessionToken();
  const res = await fetch(`${API_URL}/rooms/group/${roomId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error('모임 정보 저장에 실패했습니다.');
}

export async function uploadRoomCover(roomId: string, formData: FormData) {
  const token = await getSessionToken();
  const res = await fetch(`${API_URL}/media/rooms/${roomId}/cover`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) throw new Error('이미지 업로드에 실패했습니다.');
  const data = await res.json() as { coverImage: string };
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
  const data = await res.json() as { profileImage: string };
  return data.profileImage;
}
