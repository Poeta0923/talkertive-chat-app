'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import type { UserStats } from '@/types/admin';

const PIE_COLORS = ['#6366f1', '#a5b4fc'];

interface Props {
  stats: UserStats;
}

export default function UserStatsSection({ stats }: Props) {
  const pieData = [
    { name: '소셜 로그인', value: stats.socialCount },
    { name: '이메일 가입', value: stats.emailCount },
  ];

  const lineData = stats.last30Days.map((d) => ({
    date: d.date.slice(5),
    신규가입: d.count,
  }));

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="rounded-lg border border-border p-5">
        <p className="text-sm font-medium mb-4">최근 30일 신규 가입 추이</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={lineData}>
            <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="신규가입" stroke="#6366f1" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-lg border border-border p-5">
        <p className="text-sm font-medium mb-4">가입 유형 비율</p>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
              {pieData.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Legend />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
