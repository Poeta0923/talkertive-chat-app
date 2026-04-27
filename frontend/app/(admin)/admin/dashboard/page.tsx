import { adminControllerGetUserStats, adminControllerGetRoomStats, adminControllerGetScheduleStats } from '@/generated/openapi-client';
import StatsCard from '@/components/admin/StatsCard';
import UserStatsSection from '@/components/admin/UserStatsSection';
import RoomStatsSection from '@/components/admin/RoomStatsSection';
import ScheduleStatsSection from '@/components/admin/ScheduleStatsSection';
import type { UserStats, RoomStats, ScheduleStats } from '@/types/admin';

export default async function AdminDashboardPage() {
  const [{ data: userStats }, { data: roomStats }, { data: scheduleStats }] = await Promise.all([
    adminControllerGetUserStats(),
    adminControllerGetRoomStats(),
    adminControllerGetScheduleStats(),
  ]);

  const users = userStats as UserStats;
  const rooms = roomStats as RoomStats;
  const schedules = scheduleStats as ScheduleStats;

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold">대시보드</h1>

      {/* 유저 통계 */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">유저</h2>
        <div className="grid grid-cols-4 gap-4">
          <StatsCard title="전체 유저" value={users.total} />
          <StatsCard title="오늘 신규" value={users.todayNew} />
          <StatsCard title="이번 달 신규" value={users.thisMonthNew} />
          <StatsCard
            title="소셜 / 이메일"
            value={`${users.socialCount} / ${users.emailCount}`}
          />
        </div>
        <UserStatsSection stats={users} />
      </section>

      {/* 모임 통계 */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">모임</h2>
        <div className="grid grid-cols-3 gap-4">
          <StatsCard title="전체 모임" value={rooms.total} />
          <StatsCard title="진행 예정" value={rooms.upcoming} />
          <StatsCard title="이번 달 신규" value={rooms.thisMonthNew} />
        </div>
        <RoomStatsSection stats={rooms} />
      </section>

      {/* 일정 통계 */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">일정</h2>
        <div className="grid grid-cols-2 gap-4">
          <StatsCard title="전체 일정" value={schedules.total} />
          <StatsCard title="이번 달 일정" value={schedules.thisMonthCount} />
        </div>
        <ScheduleStatsSection stats={schedules} />
      </section>
    </div>
  );
}
