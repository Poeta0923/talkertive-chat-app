'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import Link from 'next/link';
import { ChevronRight, ExternalLink, Send, Pencil, Trash2, Check, X } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { MyRoom } from '@/hooks/useMyRooms';

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

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const isTypingRef = useRef(false);
  const typingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    let mounted = true;

    // httpOnly 쿠키는 JS에서 읽을 수 없으므로 Route Handler를 통해 토큰을 가져온다
    fetch('/api/auth/token')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { token: string } | null) => {
        if (!mounted || !data?.token) return;

        const socket = io(`${BACKEND_URL}/chat`, {
          auth: { token: data.token },
          transports: ['websocket'],
        });

        socketRef.current = socket;

        socket.on('connect', () => {
          socket.emit('join-room', { roomId });
        });

        socket.on('room-joined', ({ messages: msgs }: { messages: Message[] }) => {
          const sorted = [...msgs].reverse();
          setMessages(sorted);
          if (sorted.length > 0) {
            socket.emit('read-message', { roomId, lastMessageId: sorted[sorted.length - 1].id });
          }
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

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, 'a h:mm', { locale: ko });
    return format(date, 'M월 d일 a h:mm', { locale: ko });
  };

  const canDelete = (msg: Message) =>
    msg.senderId === currentUserId || currentUserRole === 'OWNER';

  return (
    <div className="w-[420px] h-full bg-background border-l border-border flex flex-col">
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
          <Link
            href={`/rooms/${roomId}`}
            className="p-1 hover:bg-muted rounded-md transition-colors text-muted-foreground"
            title="모임 페이지로 이동"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 flex flex-col">
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
          // 다음 메시지가 같은 발신자이고 같은 분(minute)이면 시간을 숨긴다
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
                              <span className="text-xs text-muted-foreground ml-1.5">
                                (수정됨)
                              </span>
                            )}
                          </>
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
        <div className="px-4 pb-1 text-xs text-muted-foreground shrink-0">
          {typingUserIds.map((id) => getMemberName(id)).join(', ')}님이 입력 중...
        </div>
      )}

      {/* 입력창 */}
      <div className="px-4 py-3 border-t border-border shrink-0 flex items-end gap-2">
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
