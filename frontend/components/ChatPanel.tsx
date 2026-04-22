'use client';

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import Link from 'next/link';
import { ChevronRight, ExternalLink, CalendarDays, Send, Pencil, Trash2, Check, X, Paperclip } from 'lucide-react';
import type { MyRoom } from '@/hooks/useMyRooms';
import { formatTime } from '@/lib/utils';
import { getAuthToken } from '@/lib/auth-client';
import RoomScheduleCalendar from './RoomScheduleCalendar';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

interface MessageAttachment {
  id: string;
  type: 'IMAGE' | 'FILE';
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

interface Message {
  id: string;
  roomId: string;
  senderId: string;
  content: string | null;
  isEdited: boolean;
  deletedAt: string | null;
  createdAt: string;
  sender: { id: string; name: string | null; image: string | null };
  attachments: MessageAttachment[];
}

interface ChatPanelProps {
  room: MyRoom;
  currentUserId: string;
  onBack: () => void;
}

export default function ChatPanel({ room, currentUserId, onBack }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarTriggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const socketRef = useRef<Socket | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const isTypingRef = useRef(false);
  const typingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tokenRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingScrollRef = useRef(false);
  // 이미지 onLoad가 useLayoutEffect보다 늦게 실행되므로, 초기 로드 직후 3초간만 재스크롤을 허용한다
  const initialLoadWindowRef = useRef(false);
  const initialLoadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const roomId = room.id;
  const currentUserRole = room.myRole ?? 'MEMBER';

  const roomName =
    room.type === 'DIRECT'
      ? (room.members.find((m) => m.userId !== currentUserId)?.user.name ?? '알 수 없음')
      : (room.name ?? '(이름 없음)');

  const getMemberName = useCallback(
    (userId: string) => room.members.find((m) => m.userId === userId)?.user.name ?? '알 수 없음',
    [room.members],
  );

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior });
  }, []);

  const isNearBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    return container.scrollHeight - container.scrollTop - container.clientHeight < 100;
  }, []);

  // React가 DOM을 완전히 커밋한 직후 실행되므로 scrollHeight가 항상 정확하다
  // scrollToBottom은 stable useCallback이므로 deps에서 제외한다
  useLayoutEffect(() => {
    if (!pendingScrollRef.current) return;
    pendingScrollRef.current = false;
    scrollToBottom('instant');
  }, [messages]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let mounted = true;

    getAuthToken().then((token) => {
        if (!mounted || !token) return;

        tokenRef.current = token;

        const socket = io(`${BACKEND_URL}/chat`, {
          auth: { token },
          transports: ['websocket'],
        });

        socketRef.current = socket;

        socket.on('connect', () => {
          socket.emit('join-room', { roomId });
        });

        socket.on('room-joined', ({ messages: msgs }: { messages: Message[] }) => {
          const sorted = [...msgs].reverse();
          pendingScrollRef.current = true;
          initialLoadWindowRef.current = true;
          initialLoadTimerRef.current = setTimeout(() => {
            initialLoadWindowRef.current = false;
          }, 3000);
          setMessages(sorted);
          if (sorted.length > 0) {
            socket.emit('read-message', { roomId, lastMessageId: sorted[sorted.length - 1].id });
          }
        });

        socket.on('new-message', (msg: Message) => {
          setMessages((prev) => [...prev, msg]);
          socket.emit('read-message', { roomId, lastMessageId: msg.id });
          // 사용자가 위로 스크롤해서 히스토리를 보는 중이면 강제 스크롤하지 않는다
          if (isNearBottom()) {
            requestAnimationFrame(() => requestAnimationFrame(() => scrollToBottom()));
          }
        });

        socket.on('message-edited', (msg: Message) => {
          setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
        });

        socket.on('message-deleted', ({ messageId }: { messageId: string }) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === messageId ? { ...m, deletedAt: new Date().toISOString() } : m,
            ),
          );
        });

        socket.on('user-typing', ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
          const existing = typingTimeoutsRef.current.get(userId);
          if (existing) clearTimeout(existing);

          if (isTyping) {
            setTypingUserIds((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
            const timeout = setTimeout(() => {
              setTypingUserIds((prev) => prev.filter((id) => id !== userId));
              typingTimeoutsRef.current.delete(userId);
            }, 3000);
            typingTimeoutsRef.current.set(userId, timeout);
          } else {
            typingTimeoutsRef.current.delete(userId);
            setTypingUserIds((prev) => prev.filter((id) => id !== userId));
          }
        });
      });

    return () => {
      mounted = false;
      if (initialLoadTimerRef.current) clearTimeout(initialLoadTimerRef.current);
      if (socketRef.current) {
        socketRef.current.emit('leave-room', { roomId });
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [roomId, scrollToBottom]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socketRef.current?.emit('typing', { roomId, isTyping: true });
    }

    if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
    typingDebounceRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socketRef.current?.emit('typing', { roomId, isTyping: false });
    }, 2000);
  };

  const uploadAndSendFile = async (file: File) => {
    if (!socketRef.current) return;
    setIsUploading(true);
    try {
      // 업로드 시점에 토큰을 재취득해 세션 갱신 후 stale token으로 401이 나는 것을 방지한다
      const token = await getAuthToken();
      if (!token) return;

      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${BACKEND_URL}/media/messages/${roomId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) return;
      const { url } = (await res.json()) as { url: string };
      socketRef.current.emit('send-message', {
        roomId,
        attachments: [{ url, name: file.name, size: file.size, mimeType: file.type }],
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const sendMessage = () => {
    if (!input.trim() || !socketRef.current) return;
    socketRef.current.emit('send-message', { roomId, content: input.trim() });
    setInput('');
    if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
    isTypingRef.current = false;
    socketRef.current.emit('typing', { roomId, isTyping: false });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // isComposing이 true이면 한국어 등 IME 조합 중이므로 Enter를 무시한다
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startEdit = (msg: Message) => {
    setEditingId(msg.id);
    setEditContent(msg.content ?? '');
  };

  const submitEdit = () => {
    if (!editContent.trim() || !socketRef.current || !editingId) return;
    socketRef.current.emit('edit-message', { messageId: editingId, content: editContent.trim() });
    setEditingId(null);
    setEditContent('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const deleteMessage = (messageId: string) => {
    socketRef.current?.emit('delete-message', { messageId });
  };

  const canDelete = (msg: Message) =>
    msg.senderId === currentUserId || currentUserRole === 'OWNER';

  const onImageLoad = () => {
    if (initialLoadWindowRef.current) scrollToBottom('instant');
  };

  const renderAttachments = (attachments: MessageAttachment[], isDeleted: boolean) => {
    if (isDeleted || !attachments?.length) return null;
    return attachments.map((a) =>
      a.type === 'IMAGE' ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={a.id} src={a.url} alt={a.name} onLoad={onImageLoad} className="max-w-60 rounded-xl" />
      ) : (
        <a
          key={a.id}
          href={a.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2 text-sm hover:opacity-80 transition-opacity"
        >
          <Paperclip className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate max-w-45">{a.name}</span>
        </a>
      ),
    );
  };

  return (
    <div ref={panelRef} className="w-105 h-full bg-background border-l border-border flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-border shrink-0">
        <button
          onClick={onBack}
          className="p-1 hover:bg-muted rounded-md transition-colors cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <span className="font-semibold text-sm truncate flex-1">{roomName}</span>
        {room.type === 'GROUP' && (
          <div className="flex items-center gap-1">
            <button
              ref={calendarTriggerRef}
              onClick={() => setIsCalendarOpen((prev) => !prev)}
              className="p-1 hover:bg-muted rounded-md transition-colors text-muted-foreground cursor-pointer"
              title="방 일정 보기"
            >
              <CalendarDays className="w-4 h-4" />
            </button>
            <RoomScheduleCalendar
              isOpen={isCalendarOpen}
              onClose={() => setIsCalendarOpen(false)}
              roomId={roomId}
              isOwner={currentUserRole === 'OWNER'}
              triggerRef={calendarTriggerRef}
              containerRef={panelRef}
            />
            <Link
              href={`/rooms/${roomId}`}
              className="p-1 hover:bg-muted rounded-md transition-colors text-muted-foreground"
              title="모임 페이지로 이동"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>

      {/* 메시지 목록 */}
      <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-3 flex flex-col">
        {messages.map((msg, i) => {
          const isMine = msg.senderId === currentUserId;
          const isDeleted = !!msg.deletedAt;
          const isEditing = editingId === msg.id;
          const prevMsg = i > 0 ? messages[i - 1] : null;
          const nextMsg = i < messages.length - 1 ? messages[i + 1] : null;
          const isFirstInGroup =
            !prevMsg ||
            prevMsg.senderId !== msg.senderId ||
            formatTime(prevMsg.createdAt) !== formatTime(msg.createdAt);
          const isLastInGroup =
            !nextMsg ||
            nextMsg.senderId !== msg.senderId ||
            formatTime(nextMsg.createdAt) !== formatTime(msg.createdAt);

          return (
            <div
              key={msg.id}
              className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-4' : 'mt-0.5'}`}
            >
              {/* 상대방 메시지 */}
              {!isMine && (
                <div className="flex items-end gap-2 max-w-[80%]">
                  <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 self-end">
                    {isFirstInGroup &&
                      (msg.sender.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={msg.sender.image}
                          alt={msg.sender.name ?? ''}
                          onLoad={onImageLoad}
                          className="w-full h-full object-cover bg-muted"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-medium bg-muted">
                          {msg.sender.name?.[0] ?? '?'}
                        </div>
                      ))}
                  </div>
                  <div className="flex flex-col">
                    {isFirstInGroup && (
                      <span className="text-xs text-muted-foreground mb-1 ml-1">
                        {msg.sender.name}
                      </span>
                    )}
                    <div className="flex items-end gap-1.5 group">
                      <div className="flex flex-col gap-1">
                        {renderAttachments(msg.attachments, isDeleted)}
                        {(isDeleted || msg.content) && (
                          <div
                            className={`rounded-2xl rounded-bl-sm px-3 py-2 text-sm wrap-break-word ${
                              isDeleted ? 'bg-muted text-muted-foreground italic' : 'bg-muted'
                            }`}
                          >
                            {isDeleted ? (
                              '삭제된 메시지입니다.'
                            ) : (
                              <>
                                {msg.content}
                                {msg.isEdited && (
                                  <span className="text-xs text-muted-foreground ml-1.5">
                                    (수정됨)
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {isLastInGroup && (
                          <span className="text-xs text-muted-foreground">
                            {formatTime(msg.createdAt)}
                          </span>
                        )}
                        {!isDeleted && canDelete(msg) && msg.senderId !== currentUserId && (
                          <button
                            onClick={() => deleteMessage(msg.id)}
                            className="p-0.5 hover:bg-muted rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 내 메시지 */}
              {isMine && (
                <div className="flex flex-col items-end max-w-[80%]">
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 w-full min-w-48">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            submitEdit();
                          }
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        className="flex-1 text-sm border border-border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-foreground"
                        rows={2}
                        autoFocus
                      />
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={submitEdit}
                          className="p-1 hover:bg-muted rounded-md transition-colors cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1 hover:bg-muted rounded-md transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-end gap-1.5 group">
                      {!isDeleted && (
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEdit(msg)}
                            className="p-0.5 hover:bg-muted rounded-md cursor-pointer"
                          >
                            <Pencil className="w-3 h-3 text-muted-foreground" />
                          </button>
                          {canDelete(msg) && (
                            <button
                              onClick={() => deleteMessage(msg.id)}
                              className="p-0.5 hover:bg-muted rounded-md cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3 text-muted-foreground" />
                            </button>
                          )}
                        </div>
                      )}
                      {isLastInGroup && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatTime(msg.createdAt)}
                        </span>
                      )}
                      <div className="flex flex-col items-end gap-1">
                        {renderAttachments(msg.attachments, isDeleted)}
                        {(isDeleted || msg.content) && (
                          <div
                            className={`rounded-2xl rounded-br-sm px-3 py-2 text-sm wrap-break-word ${
                              isDeleted
                                ? 'bg-muted text-muted-foreground italic'
                                : 'bg-foreground text-background'
                            }`}
                          >
                            {isDeleted ? (
                              '삭제된 메시지입니다.'
                            ) : (
                              <>
                                {msg.content}
                                {msg.isEdited && (
                                  <span className="text-xs opacity-60 ml-1.5">(수정됨)</span>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 타이핑 인디케이터 */}
      {typingUserIds.length > 0 && (
        <div className="px-4 pb-1 text-xs text-muted-foreground shrink-0">
          {typingUserIds.map((id) => getMemberName(id)).join(', ')}님이 입력 중...
        </div>
      )}

      {/* 입력창 */}
      <div className="px-4 py-3 border-t border-border shrink-0 flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadAndSendFile(file);
          }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="p-2 hover:bg-muted rounded-full transition-colors shrink-0 cursor-pointer disabled:opacity-30 disabled:cursor-default text-muted-foreground"
        >
          <Paperclip className="w-4 h-4" />
        </button>
        <textarea
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="메시지 입력... (Shift+Enter 줄바꿈)"
          className="flex-1 text-sm border border-border rounded-2xl px-4 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-foreground max-h-28 overflow-y-auto"
          rows={1}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim()}
          className="p-2 bg-foreground text-background rounded-full hover:opacity-80 transition-opacity disabled:opacity-30 shrink-0 cursor-pointer disabled:cursor-default"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
