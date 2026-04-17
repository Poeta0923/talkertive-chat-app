'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { getAuthToken } from '@/lib/auth-client';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export interface RoomListUpdatedPayload {
  roomId: string;
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    sender: { id: string; name: string | null; image: string | null };
  };
}

interface UseChatSocketOptions {
  onRoomListUpdated: (payload: RoomListUpdatedPayload) => void;
}

export function useChatSocket({ onRoomListUpdated }: UseChatSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  // 최신 콜백을 ref로 유지해 소켓 재연결 없이 핸들러를 교체할 수 있게 한다
  const callbackRef = useRef(onRoomListUpdated);
  callbackRef.current = onRoomListUpdated;

  useEffect(() => {
    getAuthToken().then((token) => {
        if (!token) return;

        const socket = io(`${BACKEND_URL}/chat`, {
          auth: { token },
          transports: ['websocket'],
        });

        socketRef.current = socket;

        socket.on('room-list-updated', (payload: RoomListUpdatedPayload) => {
          callbackRef.current(payload);
        });
      });

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  return socketRef;
}
