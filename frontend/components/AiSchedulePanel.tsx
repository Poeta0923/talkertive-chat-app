'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { processAiSchedule, type AiActionType, type RoomSchedule } from '@/app/actions/schedule-actions';

interface AiSchedulePanelProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const ACTION_TYPES: AiActionType[] = ['일정 추가', '일정 변경', '일정 취소'];

type Step = 'select' | 'input' | 'result';

function resultMessage(actionType: AiActionType, schedule: RoomSchedule): string {
  const timeStr = new Date(schedule.time).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  if (actionType === '일정 추가') return `"${schedule.name}" 일정이 ${timeStr}에 추가되었습니다.`;
  if (actionType === '일정 변경') return `"${schedule.name}" 일정이 ${timeStr}로 변경되었습니다.`;
  return `"${schedule.name}" 일정이 취소되었습니다.`;
}

export default function AiSchedulePanel({
  isOpen,
  onClose,
  roomId,
  triggerRef,
  containerRef,
}: AiSchedulePanelProps) {
  const [step, setStep] = useState<Step>('select');
  const [actionType, setActionType] = useState<AiActionType | null>(null);
  const [userRequest, setUserRequest] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ schedule: RoomSchedule; actionType: AiActionType } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // 컨테이너 우측 끝 기준으로 패널을 고정 — left 기준이면 뷰포트 밖으로 나갈 수 있다
  useEffect(() => {
    if (!isOpen || !triggerRef.current || !containerRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    setPos({
      top: triggerRect.bottom + 4,
      right: window.innerWidth - containerRect.right + 8,
    });
  }, [isOpen, triggerRef, containerRef]);

  // 열릴 때마다 상태 초기화
  useEffect(() => {
    if (isOpen) {
      setStep('select');
      setActionType(null);
      setUserRequest('');
      setResult(null);
      setError(null);
    }
  }, [isOpen]);

  // 외부 클릭 시 닫기 — Radix Select 열려있을 때는 무시
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (document.querySelector('[data-radix-select-viewport]')) return;
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

  if (!isOpen || !pos) return null;

  const handleSelectAction = (type: AiActionType) => {
    setActionType(type);
    setStep('input');
  };

  const handleSubmit = async () => {
    if (!actionType || !userRequest.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const schedule = await processAiSchedule(roomId, actionType, userRequest.trim());
      if (schedule) {
        setResult({ schedule, actionType });
        setStep('result');
      } else {
        setError('요청을 처리하지 못했습니다. 다시 시도해 주세요.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      ref={ref}
      className="fixed z-50 w-72 bg-background border border-border rounded-xl shadow-xl p-4"
      style={{ top: pos.top, right: pos.right }}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold">AI 일정 관리</span>
        <button
          onClick={onClose}
          className="p-0.5 hover:bg-muted rounded transition-colors cursor-pointer"
        >
          <X size={14} className="text-muted-foreground" />
        </button>
      </div>

      {/* Step 1: 액션 선택 */}
      {step === 'select' && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground mb-1">어떤 작업을 할까요?</p>
          {ACTION_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => handleSelectAction(type)}
              className="w-full text-sm text-left px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors cursor-pointer"
            >
              {type}
            </button>
          ))}
        </div>
      )}

      {/* Step 2: 요청 입력 */}
      {step === 'input' && actionType && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setStep('select'); setUserRequest(''); setError(null); }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              ← 뒤로
            </button>
            <span className="text-xs font-medium text-foreground">{actionType}</span>
          </div>
          <textarea
            value={userRequest}
            onChange={(e) => setUserRequest(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={`예) 다음 주 월요일 오후 3시에 정기 모임 ${actionType === '일정 추가' ? '추가해줘' : actionType === '일정 변경' ? '오후 5시로 바꿔줘' : '취소해줘'}`}
            className="text-xs border border-border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-foreground bg-background"
            rows={3}
            autoFocus
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={submitting || !userRequest.trim()}
            className="w-full text-xs bg-foreground text-background rounded-lg py-2 hover:opacity-80 transition-opacity disabled:opacity-40 cursor-pointer disabled:cursor-default"
          >
            {submitting ? '처리 중...' : '요청하기'}
          </button>
        </div>
      )}

      {/* Step 3: 결과 */}
      {step === 'result' && result && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-foreground leading-relaxed">
            {resultMessage(result.actionType, result.schedule)}
          </p>
          <button
            onClick={() => { setStep('select'); setActionType(null); setUserRequest(''); setResult(null); }}
            className="w-full text-xs border border-border rounded-lg py-2 hover:bg-muted transition-colors cursor-pointer"
          >
            다시 요청하기
          </button>
        </div>
      )}
    </div>
  );
}
