'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { ScheduleStats } from '@/types/admin';

interface Props {
  stats: ScheduleStats;
}

export default function ScheduleStatsSection({ stats }: Props) {
  const lineData = stats.next90Days.map((d) => ({
    date: d.date.slice(5),
    예정일정: d.count,
  }));

  return (
    <div className="rounded-lg border border-border p-5">
      <p className="text-sm font-medium mb-4">향후 90일 예정 일정 분포</p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={lineData}>
          <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={8} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Line type="monotone" dataKey="예정일정" stroke="#6366f1" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
