import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { randomBytes } from 'crypto';
import slugify from 'slugify';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateGroupRoomDto } from './dto/create-group-room.dto';
import { CreateDirectRoomDto } from './dto/create-direct-room.dto';
import { UpdateGroupRoomDto } from './dto/update-group-room.dto';
import { Prisma, Room, RoomCategory, RoomType } from 'generated/prisma';

// ─── 캐시 키 헬퍼 ───────────────────────────────────────────────────────────
const roomDetailKey = (roomId: string) => `rooms:group:${roomId}`;

function roomListKey(params: {
  skip?: number;
  take?: number;
  search?: string;
  category?: RoomCategory;
}): string {
  // undefined 값은 빈 문자열로 정규화해 키를 결정론적으로 만든다
  const { skip = '', take = '', search = '', category = '' } = params;
  return `rooms:group:list:${skip}:${take}:${search}:${category}`;
}

// ─── TTL 상수 (ms) ───────────────────────────────────────────────────────────
const ROOM_LIST_TTL_MS = 60_000; // 1분 — TTL 만료만으로 충분
const ROOM_DETAIL_TTL_MS = 120_000; // 2분 — 수정/삭제 시 명시적 무효화

@Injectable()
export class RoomsService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  /**
   * GROUP 모임 채팅방을 생성하고 생성자를 OWNER로 등록한다.
   */
  async createGroupRoom(
    userId: string,
    dto: CreateGroupRoomDto,
  ): Promise<Room> {
    // name 기반으로 slug를 생성하되, @unique 충돌 방지를 위해 랜덤 4자리 접미사를 붙인다
    // 한글 등 라틴 문자가 아닌 이름은 slugify 결과가 빈 문자열이 되므로 'room'을 기본값으로 사용한다
    const suffix = randomBytes(2).toString('hex');
    const base = slugify(dto.name, { lower: true, strict: true }) || 'room';
    const slug = `${base}-${suffix}`;

    return this.prisma.room.create({
      data: {
        ...dto,
        slug,
        type: RoomType.GROUP,
        date: dto.date ? new Date(dto.date) : undefined,
        members: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
      },
    });
  }

  /**
   * GROUP 모임 채팅방 정보를 수정한다.
   * OWNER만 수정할 수 있다.
   * 수정 성공 후 해당 방의 상세 캐시를 무효화한다.
   */
  async updateGroupRoom(
    userId: string,
    roomId: string,
    dto: UpdateGroupRoomDto,
  ): Promise<Room> {
    // 방 존재 여부 및 요청자가 OWNER인지 확인
    const member = await this.prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });

    if (!member) {
      throw new NotFoundException('채팅방을 찾을 수 없습니다.');
    }

    if (member.role !== 'OWNER') {
      throw new ForbiddenException('방장만 채팅방 정보를 수정할 수 있습니다.');
    }

    const updated = await this.prisma.room.update({
      where: { id: roomId },
      data: {
        ...dto,
        date: dto.date ? new Date(dto.date) : undefined,
      },
    });

    // 상세 캐시 무효화 — 리스트는 TTL 만료로 처리
    await this.cache.del(roomDetailKey(roomId));
    return updated;
  }

  /**
   * GROUP 모임 채팅방 단건 조회. OWNER 유저 정보를 함께 반환한다.
   */
  async findOneGroupRoom(roomId: string) {
    const cacheKey = roomDetailKey(roomId);
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const room = await this.prisma.room.findUnique({
      where: { id: roomId, type: RoomType.GROUP },
      include: {
        members: {
          where: { role: 'OWNER' },
          include: { user: { select: { id: true, name: true, image: true } } },
        },
      },
    });

    if (!room) {
      throw new NotFoundException('채팅방을 찾을 수 없습니다.');
    }

    await this.cache.set(cacheKey, room, ROOM_DETAIL_TTL_MS);
    return room;
  }

  /**
   * GROUP 모임 채팅방 목록 조회.
   * date가 현재 시각 이후인 방만 조회하며, 가장 가까운 날짜 순으로 정렬한다.
   * cursor는 고유값이라 캐시 히트율이 낮으므로 캐시 키에서 제외한다.
   */
  async findAllGroupRooms(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.RoomWhereUniqueInput;
    where?: Prisma.RoomWhereInput;
    orderBy?: Prisma.RoomOrderByWithRelationInput;
    search?: string;
    category?: RoomCategory;
  }) {
    const { skip, take, cursor, where, orderBy, search, category } = params;
    const cacheKey = roomListKey({ skip, take, search, category });

    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const result = await this.prisma.room.findMany({
      skip,
      take,
      cursor,
      where: {
        ...where,
        type: RoomType.GROUP,
        date: { gte: new Date() },
        ...(search && { name: { contains: search, mode: 'insensitive' } }),
        ...(category && { category }),
      },
      orderBy: orderBy ?? { date: 'asc' },
      include: {
        _count: { select: { members: true, likes: true } },
      },
    });

    await this.cache.set(cacheKey, result, ROOM_LIST_TTL_MS);
    return result;
  }

  /**
   * 내가 활성 멤버로 참여 중인 모든 채팅방(DIRECT + GROUP) 목록을 반환한다.
   * 각 방마다 마지막 메시지와 안 읽은 메시지 수를 포함한다.
   * 마지막 메시지 기준 최신순으로 정렬하며, 메시지가 없는 방은 맨 뒤로 밀린다.
   * unreadCount 등 실시간 데이터가 포함되므로 캐시하지 않는다.
   */
  async findMyRooms(userId: string) {
    const rooms = await this.prisma.room.findMany({
      where: {
        members: { some: { userId, leftAt: null } },
      },
      include: {
        // 마지막 메시지 1개만 가져온다 (soft delete된 메시지 제외)
        messages: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            content: true,
            createdAt: true,
            sender: { select: { id: true, name: true, image: true } },
          },
        },
        // 활성 멤버 전체를 포함한다.
        // DIRECT 방에서는 상대방 정보를 꺼내는 데 사용하고,
        // GROUP 방에서는 _count.members로 인원 수를 표시한다.
        members: {
          where: { leftAt: null },
          select: {
            userId: true,
            role: true,
            lastReadAt: true,
            user: {
              select: { id: true, name: true, image: true, description: true },
            },
          },
        },
        _count: {
          select: { members: { where: { leftAt: null } } },
        },
      },
    });

    // 방마다 안 읽은 메시지 수를 계산한다.
    // N+1이 발생하지만 Promise.all로 병렬 처리해 영향을 최소화한다.
    const result = await Promise.all(
      rooms.map(async (room) => {
        const myMember = room.members.find((m) => m.userId === userId);
        const lastReadAt = myMember?.lastReadAt ?? null;

        const unreadCount = await this.prisma.message.count({
          where: {
            roomId: room.id,
            deletedAt: null,
            // lastReadAt이 null이면 모든 메시지가 안 읽은 상태이므로 조건을 생략한다
            ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
          },
        });

        const { messages, ...rest } = room;
        return {
          ...rest,
          myRole: myMember?.role,
          lastMessage: messages[0] ?? null,
          unreadCount,
        };
      }),
    );

    // 마지막 메시지 시각 기준 내림차순 정렬 (메시지 없는 방은 0으로 처리해 맨 뒤로)
    return result.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt?.getTime() ?? 0;
      const bTime = b.lastMessage?.createdAt?.getTime() ?? 0;
      return bTime - aTime;
    });
  }

  /**
   * 내가 참여 중인 DIRECT 채팅방 단건 조회. 상대방 유저 정보를 함께 반환한다.
   */
  async findOneDirectRoom(userId: string, roomId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId, type: RoomType.DIRECT },
      include: {
        members: {
          // 상대방 정보만 select
          where: { userId: { not: userId } },
          include: { user: { select: { id: true, name: true, image: true } } },
        },
      },
    });

    if (!room) {
      throw new NotFoundException('채팅방을 찾을 수 없습니다.');
    }

    // 요청자가 해당 방의 멤버인지 확인
    const isMember = await this.prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });

    if (!isMember) {
      throw new ForbiddenException('접근 권한이 없습니다.');
    }

    return room;
  }

  /**
   * GROUP 모임 채팅방을 삭제한다. OWNER만 삭제할 수 있다.
   * 삭제 성공 후 해당 방의 상세 캐시를 무효화한다.
   */
  async deleteGroupRoom(userId: string, roomId: string): Promise<void> {
    const member = await this.prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });

    if (!member) {
      throw new NotFoundException('채팅방을 찾을 수 없습니다.');
    }

    if (member.role !== 'OWNER') {
      throw new ForbiddenException('방장만 채팅방을 삭제할 수 있습니다.');
    }

    await this.prisma.room.delete({ where: { id: roomId } });
    // 상세 캐시 무효화 — 리스트는 TTL 만료로 처리 (방 삭제는 드문 이벤트)
    await this.cache.del(roomDetailKey(roomId));
  }

  /**
   * DIRECT 채팅방을 삭제한다. 참가자만 삭제할 수 있다.
   */
  async deleteDirectRoom(userId: string, roomId: string): Promise<void> {
    const member = await this.prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });

    if (!member) {
      throw new ForbiddenException('접근 권한이 없습니다.');
    }

    await this.prisma.room.delete({ where: { id: roomId } });
  }

  /**
   * 1대1 DIRECT 채팅방을 생성하고 두 유저를 멤버로 등록한다.
   * 이미 두 유저 간 DIRECT 방이 존재하면 기존 방을 반환한다.
   */
  async createDirectRoom(
    userId: string,
    dto: CreateDirectRoomDto,
  ): Promise<Room> {
    const { targetUserId } = dto;

    // 상대방 유저 존재 여부 확인
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('상대방 유저를 찾을 수 없습니다.');
    }

    // 두 유저가 모두 속한 기존 DIRECT 방 조회
    const existing = await this.prisma.room.findFirst({
      where: {
        type: RoomType.DIRECT,
        members: {
          every: {
            userId: { in: [userId, targetUserId] },
          },
        },
      },
      include: { members: true },
    });

    // 정확히 두 명인 방만 유효한 DIRECT 방으로 간주
    if (existing && existing.members.length === 2) {
      throw new ConflictException('이미 존재하는 채팅방입니다.');
    }

    return this.prisma.room.create({
      data: {
        type: RoomType.DIRECT,
        members: {
          create: [{ userId }, { userId: targetUserId }],
        },
      },
    });
  }
}
