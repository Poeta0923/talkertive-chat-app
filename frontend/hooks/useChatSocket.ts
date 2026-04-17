'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

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
    // httpOnly 쿠키는 JS에서 읽을 수 없으므로 Route Handler를 통해 토큰을 가져온다
    fetch('/api/auth/token')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { token: string } | null) => {
        if (!data?.token) return;

        const socket = io(`${BACKEND_URL}/chat`, {
          auth: { token: data.token },
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
