'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Users } from 'lucide-react';
import { getAuthToken } from '@/lib/auth-client';
import type { MyRoom } from '@/hooks/useMyRooms';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

interface InviteToGroupPanelProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: string;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export default function InviteToGroupPanel({
  isOpen,
  onClose,
  targetUserId,
  triggerRef,
  containerRef,
}: InviteToGroupPanelProps) {
  const [ownerRooms, setOwnerRooms] = useState<MyRoom[]>([]);
  const [loadingRoomId, setLoadingRoomId] = useState<string | null>(null);
  const [invitedRoomIds, setInvitedRoomIds] = useState<Set<string>>(new Set());
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // 트리거 버튼 아래 패널 위치 계산
  useEffect(() => {
    if (!isOpen || !triggerRef.current || !containerRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    setPos({
      top: triggerRect.bottom + 4,
      right: window.innerWidth - containerRect.right + 8,
    });
  }, [isOpen, triggerRef, containerRef]);

  // 열릴 때 OWNER인 GROUP 모임 목록 조회
  useEffect(() => {
    if (!isOpen) return;
    setInvitedRoomIds(new Set());

    const fetchOwnerRooms = async () => {
      try {
        const res = await fetch('/api/rooms/my');
        if (!res.ok) return;
        const data = (await res.json()) as MyRoom[];
        setOwnerRooms(data.filter((r) => r.type === 'GROUP' && r.myRole === 'OWNER'));
      } catch {
        // 네트워크 오류는 조용히 무시
      }
    };

    fetchOwnerRooms();
  }, [isOpen]);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        ref.current &&
        !ref.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, triggerRef]);

  const handleInvite = async (roomId: string) => {
    setLoadingRoomId(roomId);
    try {
      const token = await getAuthToken();
      if (!token) return;

      const res = await fetch(`${BACKEND_URL}/room-members/${roomId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUserId }),
      });

      if (res.ok) {
        setInvitedRoomIds((prev) => new Set(prev).add(roomId));
      }
    } catch {
      // 네트워크 오류는 조용히 무시
    } finally {
      setLoadingRoomId(null);
    }
  };

  if (!isOpen || !pos) return null;

  return (
    <div
      ref={ref}
      className="fixed z-50 w-72 bg-background border border-border rounded-xl shadow-xl flex flex-col"
      style={{ top: pos.top, right: pos.right }}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-semibold">모임 초대</span>
        <button
          onClick={onClose}
          className="p-0.5 hover:bg-muted rounded transition-colors cursor-pointer"
        >
          <X size={14} className="text-muted-foreground" />
        </button>
      </div>

      {/* 모임 목록 */}
      <div className="max-h-72 overflow-y-auto">
        {ownerRooms.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
            <Users className="w-6 h-6" />
            <p className="text-xs">OWNER로 참여 중인 모임이 없습니다.</p>
          </div>
        ) : (
          ownerRooms.map((room) => {
            const isInvited = invitedRoomIds.has(room.id);
            const isLoading = loadingRoomId === room.id;
            return (
              <div
                key={room.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                {/* 프로필 이미지 */}
                <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-muted flex items-center justify-center">
                  {room.profileImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={room.profileImage}
                      alt={room.name ?? ''}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-medium text-muted-foreground">
                      {room.name?.[0] ?? '?'}
                    </span>
                  )}
                </div>

                {/* 모임 이름 */}
                <span className="flex-1 text-sm truncate">{room.name ?? '(이름 없음)'}</span>

                {/* 초대하기 버튼 */}
                <button
                  onClick={() => !isInvited && handleInvite(room.id)}
                  disabled={isLoading || isInvited}
                  className="shrink-0 text-xs px-2.5 py-1 rounded-full border border-border transition-colors cursor-pointer disabled:cursor-default disabled:opacity-60 hover:bg-muted"
                >
                  {isLoading ? '초대 중...' : isInvited ? '초대됨' : '초대하기'}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
