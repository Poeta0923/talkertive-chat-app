'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getRoomSchedules, type RoomSchedule } from '@/app/actions/schedule-actions';

interface RoomScheduleCalendarProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toTimeStr(isoStr: string): string {
  const date = new Date(isoStr);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function RoomScheduleCalendar({
  isOpen,
  onClose,
  roomId,
  triggerRef,
  containerRef,
}: RoomScheduleCalendarProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [schedules, setSchedules] = useState<RoomSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [tooltip, setTooltip] = useState<{ schedules: RoomSchedule[]; x: number; y: number } | null>(null);
  // 버튼 기준으로 계산한 fixed 좌표
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // 열릴 때 패널의 왼쪽 가장자리를 기준으로 캘린더를 패널 왼쪽에 배치한다
  useEffect(() => {
    if (!isOpen || !triggerRef.current || !containerRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const panelRect = containerRef.current.getBoundingClientRect();
    setPos({
      top: triggerRect.bottom + 4,
      // 캘린더 우측 끝이 패널 좌측에 맞춰지도록 window 기준 right 값을 계산한다
      right: window.innerWidth - panelRect.left,
    });
  }, [isOpen, triggerRef, containerRef]);

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
        setTooltip(null);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, triggerRef]);

  // 열릴 때 일정 조회
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    getRoomSchedules(roomId)
      .then(setSchedules)
      .finally(() => setLoading(false));
  }, [isOpen, roomId]);

  if (!isOpen || !pos) return null;

  const scheduleMap: Record<string, RoomSchedule[]> = {};
  for (const s of schedules) {
    const key = toDateKey(new Date(s.time));
    if (!scheduleMap[key]) scheduleMap[key] = [];
    scheduleMap[key].push(s);
  }

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
    setTooltip(null);
  };

  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
    setTooltip(null);
  };

  const todayKey = toDateKey(today);

  const handleDayMouseEnter = (day: number, e: React.MouseEvent<HTMLDivElement>) => {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const daySchedules = scheduleMap[key];
    if (!daySchedules?.length) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const calendarRect = ref.current!.getBoundingClientRect();
    setTooltip({
      schedules: daySchedules,
      x: rect.left - calendarRect.left,
      y: rect.bottom - calendarRect.top + 4,
    });
  };

  const handleDayMouseLeave = () => setTooltip(null);

  return (
    <div
      ref={ref}
      className="fixed z-50"
      style={{ top: pos.top, right: pos.right }}
    >
      <div className="bg-background border border-border rounded-xl shadow-xl w-72 p-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={prevMonth}
            className="p-1 rounded hover:bg-muted transition-colors cursor-pointer"
            aria-label="이전 달"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold">
            {year}년 {month + 1}월
          </span>
          <button
            onClick={nextMonth}
            className="p-1 rounded hover:bg-muted transition-colors cursor-pointer"
            aria-label="다음 달"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* 요일 행 */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((w, i) => (
            <div
              key={w}
              className={`text-center text-xs font-medium py-1 ${
                i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-muted-foreground'
              }`}
            >
              {w}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        {loading ? (
          <div className="flex items-center justify-center h-36 text-sm text-muted-foreground">
            불러오는 중...
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-y-1 relative">
            {cells.map((day, idx) => {
              if (!day) return <div key={idx} />;
              const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const daySchedules = scheduleMap[key] ?? [];
              const isToday = key === todayKey;
              const colIdx = idx % 7;

              return (
                <div
                  key={idx}
                  onMouseEnter={(e) => handleDayMouseEnter(day, e)}
                  onMouseLeave={handleDayMouseLeave}
                  className="flex flex-col items-center py-1 rounded-lg cursor-default hover:bg-muted transition-colors"
                >
                  <span
                    className={`text-xs w-6 h-6 flex items-center justify-center rounded-full font-medium
                      ${isToday ? 'bg-foreground text-background' : ''}
                      ${!isToday && colIdx === 0 ? 'text-red-500' : ''}
                      ${!isToday && colIdx === 6 ? 'text-blue-500' : ''}
                      ${!isToday && colIdx > 0 && colIdx < 6 ? 'text-foreground' : ''}
                    `}
                  >
                    {day}
                  </span>
                  {daySchedules.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {daySchedules.slice(0, 3).map((_, i) => (
                        <span key={i} className="w-1 h-1 rounded-full bg-blue-500" />
                      ))}
                      {daySchedules.length > 3 && (
                        <span className="w-1 h-1 rounded-full bg-blue-300" />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* hover 툴팁 */}
        {tooltip && (
          <div
            className="absolute bg-background border border-border rounded-lg shadow-lg p-3 w-52 z-10"
            style={{ left: Math.min(tooltip.x, 60), top: tooltip.y }}
          >
            <div className="flex flex-col gap-2">
              {tooltip.schedules.map((s) => (
                <div key={s.id} className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-foreground truncate">{s.name}</span>
                  <span className="text-xs text-muted-foreground">{toTimeStr(s.time)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && schedules.length === 0 && (
          <p className="text-center text-xs text-muted-foreground mt-2">등록된 일정이 없습니다.</p>
        )}
      </div>
    </div>
  );
}
