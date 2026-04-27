'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import type { RoomStats } from '@/types/admin';
import { CATEGORY_LABELS } from '@/types/admin';

interface Props {
  stats: RoomStats;
}

export default function RoomStatsSection({ stats }: Props) {
  const barData = stats.byCategory.map((b) => ({
    name: CATEGORY_LABELS[b.category ?? ''] ?? b.category,
    모임수: b.count,
  }));

  const lineData = stats.last30Days.map((d) => ({
    date: d.date.slice(5),
    신규모임: d.count,
  }));

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="rounded-lg border border-border p-5">
        <p className="text-sm font-medium mb-4">카테고리별 모임 분포</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData} layout="vertical">
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={60} />
            <Tooltip />
            <Bar dataKey="모임수" fill="#6366f1" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-lg border border-border p-5">
        <p className="text-sm font-medium mb-4">최근 30일 모임 생성 추이</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={lineData}>
            <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="신규모임" stroke="#6366f1" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
