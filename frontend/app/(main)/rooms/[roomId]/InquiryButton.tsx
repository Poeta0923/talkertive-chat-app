'use client';

import { useState } from 'react';
import { useSetAtom } from 'jotai';
import { chatSidebarOpenAtom, pendingChatRoomIdAtom } from '@/store/chatSidebar';
import { createOrFindDirectRoom } from './actions';

interface InquiryButtonProps {
  ownerUserId: string;
}

export default function InquiryButton({ ownerUserId }: InquiryButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const setSidebarOpen = useSetAtom(chatSidebarOpenAtom);
  const setPendingRoomId = useSetAtom(pendingChatRoomIdAtom);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      const roomId = await createOrFindDirectRoom(ownerUserId);
      if (roomId) {
        setPendingRoomId(roomId);
        setSidebarOpen(true);
      } else {
        alert('채팅방을 찾을 수 없습니다. 다시 시도해주세요.');
      }
    } catch {
      alert('채팅방 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
    >
      {isLoading ? '연결 중...' : '가입 문의'}
    </button>
  );
}
