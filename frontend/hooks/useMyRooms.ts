'use client';

import { useState, useCallback } from 'react';
import type { RoomListUpdatedPayload } from './useChatSocket';

export interface MyRoom {
  id: string;
  type: 'DIRECT' | 'GROUP';
  name: string | null;
  coverImage: string | null;
  profileImage: string | null;
  myRole: string | null;
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    sender: { id: string; name: string | null; image: string | null };
  } | null;
  unreadCount: number;
  members: {
    userId: string;
    role: string;
    user: { id: string; name: string | null; image: string | null };
  }[];
}

export function useMyRooms(currentUserId: string | undefined) {
  const [rooms, setRooms] = useState<MyRoom[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRooms = useCallback(async () => {
    setIsLoading(true);
    try {
      // httpOnly 쿠키는 JS에서 읽을 수 없으므로 Next.js Route Handler를 통해 인증한다
      const res = await fetch('/api/rooms/my');
      if (!res.ok) return;
      const data = (await res.json()) as MyRoom[];
      setRooms(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // room-list-updated 이벤트 수신 시 해당 방의 lastMessage와 unreadCount를 업데이트한다
  const handleRoomListUpdated = useCallback(
    (payload: RoomListUpdatedPayload) => {
      setRooms((prev) => {
        const updated = prev.map((room) => {
          if (room.id !== payload.roomId) return room;
          // 내가 보낸 메시지면 unreadCount를 올리지 않는다
          const isMine = payload.lastMessage.sender.id === currentUserId;
          return {
            ...room,
            lastMessage: { ...payload.lastMessage },
            unreadCount: isMine ? room.unreadCount : room.unreadCount + 1,
          };
        });
        // 최신 메시지 기준으로 재정렬
        return [...updated].sort((a, b) => {
          const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
          const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
          return bTime - aTime;
        });
      });
    },
    [currentUserId],
  );

  const markRoomAsRead = useCallback((roomId: string) => {
    setRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, unreadCount: 0 } : r)));
  }, []);

  return { rooms, isLoading, fetchRooms, handleRoomListUpdated, markRoomAsRead };
}
