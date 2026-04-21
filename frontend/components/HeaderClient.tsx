'use client';

import { useAtom } from 'jotai';
import { useState, useRef } from 'react';
import { CalendarDays } from 'lucide-react';
import UserMenu from './UserMenu';
import ChatSidebar from './ChatSidebar';
import ScheduleCalendar from './ScheduleCalendar';
import { chatSidebarOpenAtom } from '@/store/chatSidebar';

interface HeaderClientProps {
  userId: string | undefined;
  userName: string;
}

export default function HeaderClient({ userId, userName }: HeaderClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useAtom(chatSidebarOpenAtom);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarWrapperRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <div className="flex items-center gap-2">
        {/* 캘린더 아이콘 */}
        <div ref={calendarWrapperRef} className="relative">
          <button
            onClick={() => setIsCalendarOpen((prev) => !prev)}
            className="p-2 rounded-full hover:bg-muted transition-colors cursor-pointer"
            aria-label="내 일정 보기"
          >
            <CalendarDays size={20} />
          </button>
          <ScheduleCalendar
            isOpen={isCalendarOpen}
            onClose={() => setIsCalendarOpen(false)}
          />
        </div>

        <UserMenu name={userName} onChatClick={() => setIsSidebarOpen(true)} />
      </div>

      <ChatSidebar
        currentUserId={userId}
        currentUserName={userName}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
    </>
  );
}
