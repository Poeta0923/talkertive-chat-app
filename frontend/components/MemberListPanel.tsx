'use client';

import { ChevronRight } from 'lucide-react';
import type { MyRoom } from '@/hooks/useMyRooms';

interface Props {
  members: MyRoom['members'];
  currentUserId: string;
  isOwner: boolean;
  onClose: () => void;
  onChat: (userId: string) => void;
  onKick: (userId: string, name: string) => void;
  isChatLoading: boolean;
  isKickLoading: boolean;
}

export default function MemberListPanel({
  members,
  currentUserId,
  isOwner,
  onClose,
  onChat,
  onKick,
  isChatLoading,
  isKickLoading,
}: Props) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-background border-l border-border">
      <div className="flex items-center gap-2 px-4 py-4 border-b border-border shrink-0">
        <button
          onClick={onClose}
          className="p-1 hover:bg-muted rounded-md transition-colors cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <span className="font-semibold text-sm">멤버 목록</span>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
        {members.map((m) => {
          const isSelf = m.userId === currentUserId;
          return (
            <div key={m.userId} className="flex items-center gap-3 py-2">
              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-muted flex items-center justify-center text-xs font-medium">
                {m.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.user.image}
                    alt={m.user.name ?? ''}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  m.user.name?.[0] ?? '?'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">
                  {m.user.name ?? '알 수 없음'}
                  {isSelf && <span className="text-muted-foreground"> (나)</span>}
                </p>
                {m.role === 'OWNER' && (
                  <p className="text-xs text-muted-foreground">방장</p>
                )}
              </div>
              {!isSelf && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onChat(m.userId)}
                    disabled={isChatLoading || isKickLoading}
                    className="px-3 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
                  >
                    채팅
                  </button>
                  {isOwner && (
                    <button
                      onClick={() => onKick(m.userId, m.user.name ?? '이 멤버')}
                      disabled={isChatLoading || isKickLoading}
                      className="px-3 py-1.5 text-xs font-medium border border-border rounded-md text-destructive hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
                    >
                      추방
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
