'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getCookie } from 'cookies-next/client';
import Link from 'next/link';
import { ChevronLeft, Send, Pencil, Trash2, Check, X } from 'lucide-react';
import { formatTime } from '@/lib/utils';

const AUTH_COOKIE_NAME =
  process.env.NODE_ENV === 'production'
    ? '__Secure-authjs.session-token'
    : 'authjs.session-token';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

interface Message {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  isEdited: boolean;
  deletedAt: string | null;
  createdAt: string;
  sender: { id: string; name: string | null; image: string | null };
}

interface Member {
  userId: string;
  role: string;
  user: { id: string; name: string | null; image: string | null };
}

interface ChatRoomProps {
  roomId: string;
  roomName: string;
  roomType: 'DIRECT' | 'GROUP';
  currentUserId: string;
  currentUserRole: string;
  members: Member[];
}

export default function ChatRoom({
  roomId,
  roomName,
  roomType,
  currentUserId,
  currentUserRole,
  members,
}: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const isTypingRef = useRef(false);
  const typingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getMemberName = useCallback(
    (userId: string) => members.find((m) => m.userId === userId)?.user.name ?? '알 수 없음',
    [members],
  );

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    const token = getCookie(AUTH_COOKIE_NAME) as string | undefined;
    if (!token) return;

    const socket = io(`${BACKEND_URL}/chat`, {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-room', { roomId });
    });

    socket.on('room-joined', ({ messages: msgs }: { messages: Message[] }) => {
      // 서버는 desc 순으로 반환하므로 뒤집어 오름차순으로 표시한다
      const sorted = [...msgs].reverse();
      setMessages(sorted);
      if (sorted.length > 0) {
        socket.emit('read-message', { roomId, lastMessageId: sorted[sorted.length - 1].id });
      }
      // 초기 로드 시에는 즉시 스크롤
      setTimeout(() => scrollToBottom('instant'), 0);
    });

    socket.on('new-message', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      socket.emit('read-message', { roomId, lastMessageId: msg.id });
      scrollToBottom();
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
        // 3초 후 자동으로 타이핑 상태를 해제한다
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

    return () => {
      socket.emit('leave-room', { roomId });
      socket.disconnect();
      socketRef.current = null;
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

  const sendMessage = () => {
    if (!input.trim() || !socketRef.current) return;
    socketRef.current.emit('send-message', { roomId, content: input.trim() });
    setInput('');
    if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
    isTypingRef.current = false;
    socketRef.current.emit('typing', { roomId, isTyping: false });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startEdit = (msg: Message) => {
    setEditingId(msg.id);
    setEditContent(msg.content);
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

  const backHref = roomType === 'GROUP' ? `/rooms/${roomId}` : '/';

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
        <Link href={backHref} className="p-1 hover:bg-muted rounded-md transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <span className="font-semibold text-base truncate">{roomName}</span>
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col">
        {messages.map((msg, i) => {
          const isMine = msg.senderId === currentUserId;
          const isDeleted = !!msg.deletedAt;
          const isEditing = editingId === msg.id;
          const prevMsg = i > 0 ? messages[i - 1] : null;
          const isFirstInGroup = !prevMsg || prevMsg.senderId !== msg.senderId;

          return (
            <div
              key={msg.id}
              className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-4' : 'mt-0.5'}`}
            >
              {/* 상대방 메시지 */}
              {!isMine && (
                <div className="flex items-end gap-2 max-w-[70%]">
                  {/* 아바타: 그룹 첫 메시지에만 표시, 이후는 공간만 확보 */}
                  <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 self-end">
                    {isFirstInGroup &&
                      (msg.sender.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={msg.sender.image}
                          alt={msg.sender.name ?? ''}
                          className="w-full h-full object-cover bg-muted"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-medium bg-muted">
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
                      <div
                        className={`rounded-2xl rounded-bl-sm px-3 py-2 text-sm break-words ${
                          isDeleted ? 'bg-muted text-muted-foreground italic' : 'bg-muted'
                        }`}
                      >
                        {isDeleted ? (
                          '삭제된 메시지입니다.'
                        ) : (
                          <>
                            {msg.content}
                            {msg.isEdited && (
                              <span className="text-xs text-muted-foreground ml-1.5">(수정됨)</span>
                            )}
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-xs text-muted-foreground">{formatTime(msg.createdAt)}</span>
                        {/* OWNER는 다른 사람 메시지도 삭제 가능 */}
                        {!isDeleted && canDelete(msg) && msg.senderId !== currentUserId && (
                          <button
                            onClick={() => deleteMessage(msg.id)}
                            className="p-0.5 hover:bg-muted rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 내 메시지 */}
              {isMine && (
                <div className="flex flex-col items-end max-w-[70%]">
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
                          className="p-1 hover:bg-muted rounded-md transition-colors"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1 hover:bg-muted rounded-md transition-colors"
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
                            className="p-0.5 hover:bg-muted rounded-md"
                          >
                            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                          {canDelete(msg) && (
                            <button
                              onClick={() => deleteMessage(msg.id)}
                              className="p-0.5 hover:bg-muted rounded-md"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                          )}
                        </div>
                      )}
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatTime(msg.createdAt)}
                      </span>
                      <div
                        className={`rounded-2xl rounded-br-sm px-3 py-2 text-sm break-words ${
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
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 타이핑 인디케이터 */}
      {typingUserIds.length > 0 && (
        <div className="px-5 pb-1 text-xs text-muted-foreground shrink-0">
          {typingUserIds.map((id) => getMemberName(id)).join(', ')}님이 입력 중...
        </div>
      )}

      {/* 입력창 */}
      <div className="px-4 py-3 border-t border-border shrink-0 flex items-end gap-2">
        <textarea
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요... (Shift+Enter로 줄바꿈)"
          className="flex-1 text-sm border border-border rounded-2xl px-4 py-2.5 resize-none focus:outline-none focus:ring-1 focus:ring-foreground max-h-32 overflow-y-auto"
          rows={1}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim()}
          className="p-2.5 bg-foreground text-background rounded-full hover:opacity-80 transition-opacity disabled:opacity-30 shrink-0 cursor-pointer disabled:cursor-default"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
