'use client';

import { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { X } from 'lucide-react';
import { useChatSocket } from '@/hooks/useChatSocket';
import { useMyRooms, type MyRoom } from '@/hooks/useMyRooms';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import ChatPanel from './ChatPanel';
import { pendingChatRoomIdAtom } from '@/store/chatSidebar';

interface ChatSidebarProps {
  currentUserId: string | undefined;
  currentUserName: string | undefined;
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatSidebar({
  currentUserId,
  isOpen,
  onClose,
}: ChatSidebarProps) {
  const { rooms, isLoading, fetchRooms, handleRoomListUpdated, markRoomAsRead } =
    useMyRooms(currentUserId);
  const [selectedRoom, setSelectedRoom] = useState<MyRoom | null>(null);
  const [pendingRoomId, setPendingRoomId] = useAtom(pendingChatRoomIdAtom);

  useChatSocket({ onRoomListUpdated: handleRoomListUpdated });

  useEffect(() => {
    if (isOpen) fetchRooms();
  }, [isOpen, fetchRooms]);

  // 사이드바가 닫힐 때 채팅 패널도 초기화한다
  useEffect(() => {
    if (!isOpen) setSelectedRoom(null);
  }, [isOpen]);

  // pendingRoomId가 설정되면 rooms 목록에서 해당 방을 찾아 자동 선택한다
  useEffect(() => {
    if (!pendingRoomId || rooms.length === 0) return;
    const room = rooms.find((r) => r.id === pendingRoomId);
    if (room) {
      setSelectedRoom(room);
      markRoomAsRead(room.id);
      setPendingRoomId(null);
    }
  }, [pendingRoomId, rooms, markRoomAsRead, setPendingRoomId]);

  const handleRoomSelect = (room: MyRoom) => {
    setSelectedRoom(room);
    markRoomAsRead(room.id);
  };

  const getRoomDisplay = (room: MyRoom) => {
    if (room.type === 'GROUP') {
      return {
        name: room.name ?? '(이름 없음)',
        image: room.profileImage,
        initial: room.name?.[0] ?? '?',
      };
    }
    const other = room.members.find((m) => m.userId !== currentUserId);
    return {
      name: other?.user.name ?? '알 수 없음',
      image: other?.user.image ?? null,
      initial: other?.user.name?.[0] ?? '?',
    };
  };

  return (
    <>
      {/* 배경 dimmer */}
      {isOpen && <div className="fixed inset-0 z-40" onClick={onClose} />}

      {/* 슬라이딩 컨테이너: 채팅 패널 + 목록 */}
      <div
        className={`fixed top-0 right-0 h-full z-50 flex transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* 채팅 패널: 방을 선택했을 때만 표시 */}
        {selectedRoom && currentUserId && (
          <ChatPanel
            key={selectedRoom.id}
            room={selectedRoom}
            currentUserId={currentUserId}
            onBack={() => setSelectedRoom(null)}
          />
        )}

        {/* 방 목록 */}
        <div className="w-80 h-full bg-background border-l border-border shadow-xl flex flex-col">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
            <span className="font-semibold text-base">내 채팅</span>
            <button
              onClick={onClose}
              className="p-1 hover:bg-muted rounded-md transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 목록 */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                불러오는 중...
              </div>
            ) : rooms.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                참여 중인 채팅방이 없습니다.
              </div>
            ) : (
              rooms.map((room) => {
                const { name, image, initial } = getRoomDisplay(room);
                const isSelected = selectedRoom?.id === room.id;

                return (
                  <button
                    key={room.id}
                    onClick={() => handleRoomSelect(room)}
                    className={`w-full flex items-center gap-3 px-5 py-3 hover:bg-muted transition-colors text-left cursor-pointer ${
                      isSelected ? 'bg-muted' : ''
                    }`}
                  >
                    {/* 프로필 이미지 */}
                    <div className="w-11 h-11 rounded-full bg-muted-foreground/20 overflow-hidden shrink-0">
                      {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={image} alt={name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm font-medium">
                          {initial}
                        </div>
                      )}
                    </div>

                    {/* 텍스트 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium truncate">{name}</span>
                        {room.lastMessage && (
                          <span className="text-xs text-muted-foreground shrink-0">
                            {formatDistanceToNow(new Date(room.lastMessage.createdAt), {
                              addSuffix: false,
                              locale: ko,
                            })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground truncate">
                          {room.lastMessage?.content ?? '메시지가 없습니다.'}
                        </span>
                        {room.unreadCount > 0 && (
                          <span className="shrink-0 min-w-5 h-5 px-1.5 bg-foreground text-background text-xs font-medium rounded-full flex items-center justify-center">
                            {room.unreadCount > 99 ? '99+' : room.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}
