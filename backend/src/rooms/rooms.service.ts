import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateGroupRoomDto } from './dto/create-group-room.dto';
import { CreateDirectRoomDto } from './dto/create-direct-room.dto';
import { UpdateGroupRoomDto } from './dto/update-group-room.dto';
import { Prisma, Room, RoomType } from 'generated/prisma';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  /**
   * GROUP 모임 채팅방을 생성하고 생성자를 OWNER로 등록한다.
   */
  async createGroupRoom(userId: string, dto: CreateGroupRoomDto): Promise<Room> {
    return this.prisma.room.create({
      data: {
        ...dto,
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
   */
  async updateGroupRoom(userId: string, roomId: string, dto: UpdateGroupRoomDto): Promise<Room> {
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

    return this.prisma.room.update({
      where: { id: roomId },
      data: {
        ...dto,
        date: dto.date ? new Date(dto.date) : undefined,
      },
    });
  }

  /**
   * GROUP 모임 채팅방 단건 조회. OWNER 유저 정보를 함께 반환한다.
   */
  async findOneGroupRoom(roomId: string) {
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

    return room;
  }

  /**
   * GROUP 모임 채팅방 목록 조회.
   * date가 현재 시각 이후인 방만 조회하며, 가장 가까운 날짜 순으로 정렬한다.
   */
  async findAllGroupRooms(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.RoomWhereUniqueInput;
    where?: Prisma.RoomWhereInput;
    orderBy?: Prisma.RoomOrderByWithRelationInput;
  }) {
    const { skip, take, cursor, where, orderBy } = params;

    return this.prisma.room.findMany({
      skip,
      take,
      cursor,
      where: {
        ...where,
        type: RoomType.GROUP,
        date: { gte: new Date() },
      },
      orderBy: orderBy ?? { date: 'asc' },
      include: {
        _count: { select: { members: true, likes: true } },
      },
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
   * 내가 참여 중인 DIRECT 채팅방 목록 조회. 각 방의 상대방 유저 정보를 함께 반환한다.
   */
  async findAllDirectRooms(userId: string) {
    return this.prisma.room.findMany({
      where: {
        type: RoomType.DIRECT,
        members: { some: { userId } },
      },
      include: {
        members: {
          where: { userId: { not: userId } },
          include: { user: { select: { id: true, name: true, image: true } } },
        },
      },
    });
  }

  /**
   * 1대1 DIRECT 채팅방을 생성하고 두 유저를 멤버로 등록한다.
   * 이미 두 유저 간 DIRECT 방이 존재하면 기존 방을 반환한다.
   */
  async createDirectRoom(userId: string, dto: CreateDirectRoomDto): Promise<Room> {
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
