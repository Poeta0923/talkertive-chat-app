'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  createSchedule,
  deleteSchedule,
  getRoomSchedules,
  updateSchedule,
  type RoomSchedule,
} from '@/app/actions/schedule-actions';

interface RoomScheduleCalendarProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  isOwner: boolean;
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

function toDateInputVal(isoStr: string): string {
  return toDateKey(new Date(isoStr));
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

type FormState = { name: string; date: string; hour: string; minute: string };
type AddForm = FormState;
type EditForm = FormState & { scheduleId: string };

// 폼 상태에서 ISO 시간 문자열 생성
function toIsoTime(date: string, hour: string, minute: string): string {
  return new Date(`${date}T${hour}:${minute}`).toISOString();
}

interface ScheduleFormProps {
  label: string;
  form: FormState;
  submitting: boolean;
  onChange: (patch: Partial<FormState>) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
  submittingLabel: string;
}

function ScheduleForm({
  label,
  form,
  submitting,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
  submittingLabel,
}: ScheduleFormProps) {
  const isValid = form.name.trim() && form.date && form.hour && form.minute;

  return (
    <div className="flex flex-col gap-2 pt-2 border-t border-border">
      <span className="text-xs text-muted-foreground font-medium">{label}</span>

      {/* 일정 이름 */}
      <input
        type="text"
        placeholder="일정 이름"
        value={form.name}
        onChange={(e) => onChange({ name: e.target.value })}
        className="text-xs border border-border rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-foreground bg-background"
      />

      {/* 날짜 */}
      <input
        type="date"
        value={form.date}
        onChange={(e) => onChange({ date: e.target.value })}
        className="text-xs border border-border rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-foreground bg-background w-full"
      />

      {/* 시간 — 시/분 Select */}
      <div className="flex items-center gap-1.5">
        <Select value={form.hour} onValueChange={(v) => onChange({ hour: v })}>
          <SelectTrigger className="flex-1 h-7 text-xs px-2">
            <SelectValue placeholder="시" />
          </SelectTrigger>
          <SelectContent position="popper" style={{ maxHeight: '12rem' }}>
            {HOURS.map((h) => (
              <SelectItem key={h} value={h} className="text-xs">
                {h}시
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground shrink-0">:</span>
        <Select value={form.minute} onValueChange={(v) => onChange({ minute: v })}>
          <SelectTrigger className="flex-1 h-7 text-xs px-2">
            <SelectValue placeholder="분" />
          </SelectTrigger>
          <SelectContent position="popper" style={{ maxHeight: '12rem' }}>
            {MINUTES.map((m) => (
              <SelectItem key={m} value={m} className="text-xs">
                {m}분
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 버튼 */}
      <div className="flex gap-1">
        <button
          onClick={onSubmit}
          disabled={submitting || !isValid}
          className="flex-1 text-xs bg-foreground text-background rounded-md py-1.5 hover:opacity-80 transition-opacity disabled:opacity-40 cursor-pointer disabled:cursor-default"
        >
          {submitting ? submittingLabel : submitLabel}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 text-xs border border-border rounded-md py-1.5 hover:bg-muted transition-colors cursor-pointer"
        >
          취소
        </button>
      </div>
    </div>
  );
}

export default function RoomScheduleCalendar({
  isOpen,
  onClose,
  roomId,
  isOwner,
  triggerRef,
  containerRef,
}: RoomScheduleCalendarProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [schedules, setSchedules] = useState<RoomSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<{
    day: number;
    schedules: RoomSchedule[];
    x: number;
    y: number;
  } | null>(null);
  const [addForm, setAddForm] = useState<AddForm | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !triggerRef.current || !containerRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const panelRect = containerRef.current.getBoundingClientRect();
    setPos({
      top: triggerRect.bottom + 4,
      right: window.innerWidth - panelRect.left,
    });
  }, [isOpen, triggerRef, containerRef]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Radix UI Select가 포탈로 열려있으면 아이템 클릭이 ref 외부로 판정된다 — 닫지 않는다
      // item-aligned 모드에서는 data-radix-popper-content-wrapper가 없으므로 viewport로 감지한다
      if (document.querySelector('[data-radix-select-viewport]')) return;

      if (
        ref.current &&
        !ref.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        onClose();
        setSelectedDay(null);
        setAddForm(null);
        setEditForm(null);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, triggerRef]);

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
    setSelectedDay(null);
    setAddForm(null);
    setEditForm(null);
  };

  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
    setSelectedDay(null);
    setAddForm(null);
    setEditForm(null);
  };

  const todayKey = toDateKey(today);

  const syncSelectedDay = (updated: RoomSchedule[], day: number) => {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const daySchedules = updated.filter((s) => toDateKey(new Date(s.time)) === key);
    setSelectedDay((prev) => prev && { ...prev, schedules: daySchedules });
  };

  const handleDayClick = (day: number, e: React.MouseEvent<HTMLDivElement>) => {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const daySchedules = scheduleMap[key] ?? [];
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const gridRect = gridRef.current!.getBoundingClientRect();

    if (selectedDay?.day === day && selectedDay.x === rect.left - gridRect.left) {
      setSelectedDay(null);
      setAddForm(null);
      setEditForm(null);
      return;
    }

    setAddForm(null);
    setEditForm(null);
    setSelectedDay({
      day,
      schedules: daySchedules,
      x: rect.left - gridRect.left,
      y: rect.bottom - gridRect.top + 4,
    });
  };

  const handleAddSchedule = async () => {
    if (!addForm || !addForm.name.trim() || !addForm.date || !addForm.hour || !addForm.minute) return;
    setSubmitting(true);
    try {
      const created = await createSchedule(
        roomId,
        addForm.name.trim(),
        toIsoTime(addForm.date, addForm.hour, addForm.minute),
      );
      if (created) {
        const updated = [...schedules, created].sort(
          (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
        );
        setSchedules(updated);
        if (selectedDay) syncSelectedDay(updated, selectedDay.day);
        setAddForm(null);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSchedule = async () => {
    if (!editForm || !editForm.name.trim() || !editForm.date || !editForm.hour || !editForm.minute) return;
    setSubmitting(true);
    try {
      const updatedSchedule = await updateSchedule(
        roomId,
        editForm.scheduleId,
        editForm.name.trim(),
        toIsoTime(editForm.date, editForm.hour, editForm.minute),
      );
      if (updatedSchedule) {
        const updated = schedules
          .map((s) => (s.id === editForm.scheduleId ? updatedSchedule : s))
          .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
        setSchedules(updated);
        if (selectedDay) syncSelectedDay(updated, selectedDay.day);
        setEditForm(null);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    const ok = await deleteSchedule(roomId, scheduleId);
    if (ok) {
      const updated = schedules.filter((s) => s.id !== scheduleId);
      setSchedules(updated);
      if (selectedDay) syncSelectedDay(updated, selectedDay.day);
      if (editForm?.scheduleId === scheduleId) setEditForm(null);
    }
  };

  const startEdit = (s: RoomSchedule) => {
    const timeStr = toTimeStr(s.time);
    const [hour, minute] = timeStr.split(':');
    // 분 값이 유효하지 않은 예외 상황에는 00으로 대체한다
    const roundedMinute = MINUTES.includes(minute) ? minute : '00';
    setAddForm(null);
    setEditForm({
      scheduleId: s.id,
      name: s.name,
      date: toDateInputVal(s.time),
      hour,
      minute: roundedMinute,
    });
  };

  return (
    <div ref={ref} className="fixed z-50" style={{ top: pos.top, right: pos.right }}>
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
          <div ref={gridRef} className="grid grid-cols-7 gap-y-1 relative">
            {cells.map((day, idx) => {
              if (!day) return <div key={idx} />;
              const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const daySchedules = scheduleMap[key] ?? [];
              const isToday = key === todayKey;
              const isSelected = selectedDay?.day === day;
              const colIdx = idx % 7;

              return (
                <div
                  key={idx}
                  onClick={(e) => handleDayClick(day, e)}
                  className={`flex flex-col items-center py-1 rounded-lg cursor-pointer transition-colors ${
                    isSelected ? 'bg-muted' : 'hover:bg-muted'
                  }`}
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

            {/* 날짜 클릭 팝오버 */}
            {selectedDay && (
              <div
                className="absolute bg-background border border-border rounded-lg shadow-lg p-3 w-56 z-10"
                style={{ left: Math.min(selectedDay.x, 48), top: selectedDay.y }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-foreground">
                    {month + 1}월 {selectedDay.day}일
                  </span>
                  <button
                    onClick={() => {
                      setSelectedDay(null);
                      setAddForm(null);
                      setEditForm(null);
                    }}
                    className="p-0.5 hover:bg-muted rounded transition-colors cursor-pointer"
                  >
                    <X size={12} className="text-muted-foreground" />
                  </button>
                </div>

                {/* 일정 목록 */}
                <div className="flex flex-col gap-1.5 mb-2">
                  {selectedDay.schedules.length === 0 ? (
                    <p className="text-xs text-muted-foreground">등록된 일정이 없습니다.</p>
                  ) : (
                    selectedDay.schedules.map((s) => (
                      <div key={s.id} className="flex items-start justify-between gap-1 group">
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span
                            className={`text-xs font-medium truncate ${
                              editForm?.scheduleId === s.id
                                ? 'text-muted-foreground'
                                : 'text-foreground'
                            }`}
                          >
                            {s.name}
                          </span>
                          <span className="text-xs text-muted-foreground">{toTimeStr(s.time)}</span>
                        </div>
                        {isOwner && (
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
                            <button
                              onClick={() => startEdit(s)}
                              className="p-0.5 hover:bg-muted rounded transition-colors cursor-pointer"
                            >
                              <Pencil size={11} className="text-muted-foreground" />
                            </button>
                            <button
                              onClick={() => handleDeleteSchedule(s.id)}
                              className="p-0.5 hover:bg-muted rounded transition-colors cursor-pointer"
                            >
                              <Trash2 size={11} className="text-muted-foreground" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* 일정 수정 폼 */}
                {isOwner && editForm && (
                  <ScheduleForm
                    label="일정 수정"
                    form={editForm}
                    submitting={submitting}
                    onChange={(patch) => setEditForm((f) => f && { ...f, ...patch })}
                    onSubmit={handleUpdateSchedule}
                    onCancel={() => setEditForm(null)}
                    submitLabel="수정"
                    submittingLabel="수정 중..."
                  />
                )}

                {/* 일정 추가 폼 (수정 폼이 열려있지 않을 때만) */}
                {isOwner && !editForm && (
                  <>
                    {addForm ? (
                      <ScheduleForm
                        label="일정 추가"
                        form={addForm}
                        submitting={submitting}
                        onChange={(patch) => setAddForm((f) => f && { ...f, ...patch })}
                        onSubmit={handleAddSchedule}
                        onCancel={() => setAddForm(null)}
                        submitLabel="추가"
                        submittingLabel="추가 중..."
                      />
                    ) : (
                      <button
                        onClick={() => {
                          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay.day).padStart(2, '0')}`;
                          setAddForm({ name: '', date: dateStr, hour: '00', minute: '00' });
                        }}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer pt-2 border-t border-border w-full"
                      >
                        <Plus size={12} />
                        일정 추가
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {!loading && schedules.length === 0 && (
          <p className="text-center text-xs text-muted-foreground mt-2">등록된 일정이 없습니다.</p>
        )}
      </div>
    </div>
  );
}
