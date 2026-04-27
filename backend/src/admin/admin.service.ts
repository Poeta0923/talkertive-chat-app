import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, RoomType } from 'generated/prisma';
import { AdminUserQueryDto } from './dto/admin-user-query.dto';
import { AdminRoomQueryDto } from './dto/admin-room-query.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ─── 통계 ─────────────────────────────────────────────────────────────────

  async getUserStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const [total, todayNew, thisMonthNew, recentUsers, socialCount] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      this.prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
      this.prisma.user.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true },
      }),
      // OAuth 계정이 연결된 유저를 소셜 로그인 유저로 집계
      this.prisma.user.count({
        where: { accounts: { some: { type: 'oauth' } } },
      }),
    ]);

    const dailyMap: Record<string, number> = {};
    recentUsers.forEach(({ createdAt }) => {
      const date = createdAt.toISOString().split('T')[0];
      dailyMap[date] = (dailyMap[date] || 0) + 1;
    });

    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(thirtyDaysAgo);
      d.setDate(d.getDate() + i);
      const date = d.toISOString().split('T')[0];
      return { date, count: dailyMap[date] || 0 };
    });

    return {
      total,
      todayNew,
      thisMonthNew,
      last30Days,
      socialCount,
      emailCount: total - socialCount,
    };
  }

  async getRoomStats() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const [total, upcoming, thisMonthNew, recentRooms, byCategory] = await Promise.all([
      this.prisma.room.count({ where: { type: RoomType.GROUP } }),
      this.prisma.room.count({ where: { type: RoomType.GROUP, date: { gte: now } } }),
      this.prisma.room.count({
        where: { type: RoomType.GROUP, createdAt: { gte: monthStart } },
      }),
      this.prisma.room.findMany({
        where: { type: RoomType.GROUP, createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true },
      }),
      this.prisma.room.groupBy({
        by: ['category'],
        where: { type: RoomType.GROUP, category: { not: null } },
        _count: { _all: true },
      }),
    ]);

    const dailyMap: Record<string, number> = {};
    recentRooms.forEach(({ createdAt }) => {
      const date = createdAt.toISOString().split('T')[0];
      dailyMap[date] = (dailyMap[date] || 0) + 1;
    });

    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(thirtyDaysAgo);
      d.setDate(d.getDate() + i);
      const date = d.toISOString().split('T')[0];
      return { date, count: dailyMap[date] || 0 };
    });

    return {
      total,
      upcoming,
      thisMonthNew,
      last30Days,
      byCategory: byCategory.map((b) => ({ category: b.category, count: b._count._all })),
    };
  }

  async getScheduleStats() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const [total, thisMonthCount, recentSchedules] = await Promise.all([
      this.prisma.roomSchedule.count(),
      this.prisma.roomSchedule.count({ where: { createdAt: { gte: monthStart } } }),
      this.prisma.roomSchedule.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true },
      }),
    ]);

    const dailyMap: Record<string, number> = {};
    recentSchedules.forEach(({ createdAt }) => {
      const date = createdAt.toISOString().split('T')[0];
      dailyMap[date] = (dailyMap[date] || 0) + 1;
    });

    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(thirtyDaysAgo);
      d.setDate(d.getDate() + i);
      const date = d.toISOString().split('T')[0];
      return { date, count: dailyMap[date] || 0 };
    });

    return { total, thisMonthCount, last30Days };
  }

  // ─── 유저 관리 ───────────────────────────────────────────────────────────

  async findAllUsers(query: AdminUserQueryDto) {
    const { skip, take, search, role } = query;

    const where: Prisma.UserWhereInput = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(role && { role }),
    };

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: skip ? Number(skip) : 0,
        take: take ? Number(take) : 20,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          createdAt: true,
          _count: {
            select: { roomMembers: { where: { leftAt: null } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total };
  }

  async findOneUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        description: true,
        role: true,
        createdAt: true,
        roomMembers: {
          where: { leftAt: null },
          include: {
            room: {
              select: {
                id: true,
                name: true,
                type: true,
                category: true,
                coverImage: true,
                date: true,
                shortDescription: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) throw new NotFoundException('유저를 찾을 수 없습니다.');

    const ownedRooms = user.roomMembers.filter((m) => m.role === 'OWNER').map((m) => m.room);
    const joinedRooms = user.roomMembers.filter((m) => m.role === 'MEMBER').map((m) => m.room);

    const { roomMembers: _, ...rest } = user;
    return { ...rest, ownedRooms, joinedRooms };
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('유저를 찾을 수 없습니다.');

    await this.prisma.$transaction([
      // Message.senderId에 onDelete가 없으므로 메시지 먼저 삭제
      // MessageAttachment, MessageRead는 Message onDelete: Cascade로 자동 처리
      this.prisma.message.deleteMany({ where: { senderId: id } }),
      // Account, Session, RoomMember, RoomLike, MessageRead는 User onDelete: Cascade로 자동 처리
      this.prisma.user.delete({ where: { id } }),
    ]);
  }

  // ─── 모임 관리 ───────────────────────────────────────────────────────────

  async findAllRooms(query: AdminRoomQueryDto) {
    const { skip, take, search, category, type } = query;

    const where: Prisma.RoomWhereInput = {
      type: type ?? RoomType.GROUP,
      ...(search && { name: { contains: search, mode: 'insensitive' } }),
      ...(category && { category }),
    };

    const [items, total] = await Promise.all([
      this.prisma.room.findMany({
        where,
        skip: skip ? Number(skip) : 0,
        take: take ? Number(take) : 20,
        include: {
          _count: { select: { members: { where: { leftAt: null } } } },
          members: {
            where: { role: 'OWNER', leftAt: null },
            include: {
              user: { select: { id: true, name: true, image: true } },
            },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.room.count({ where }),
    ]);

    return { items, total };
  }

  async findOneRoom(id: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: {
        members: {
          where: { leftAt: null },
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        schedules: { orderBy: { time: 'asc' } },
        _count: { select: { messages: true, likes: true } },
      },
    });

    if (!room) throw new NotFoundException('모임을 찾을 수 없습니다.');
    return room;
  }

  async deleteRoom(id: string): Promise<void> {
    const room = await this.prisma.room.findUnique({ where: { id } });
    if (!room) throw new NotFoundException('모임을 찾을 수 없습니다.');

    // Room 삭제 시 Cascade: Message, RoomMember, RoomLike, RoomSchedule 자동 삭제
    // Message 삭제 시 Cascade: MessageAttachment, MessageRead 자동 삭제
    await this.prisma.room.delete({ where: { id } });
  }
}
