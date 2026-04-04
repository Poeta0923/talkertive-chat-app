import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { InviteMemberDto } from './dto/invite-member.dto';
import { TransferOwnerDto } from './dto/transfer-owner.dto';

@Injectable()
export class RoomMembersService {
  constructor(private prisma: PrismaService) {}

  /**
   * GROUP 채팅방에 유저를 초대한다. 요청자가 OWNER여야 한다.
   * 이전에 나간 멤버는 재초대 시 복귀 처리한다.
   */
  async inviteMember(requesterId: string, roomId: string, dto: InviteMemberDto) {
    const { targetUserId } = dto;

    await this.assertOwner(requesterId, roomId);

    const targetUser = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      throw new NotFoundException('초대할 유저를 찾을 수 없습니다.');
    }

    // memberLimit이 설정된 방은 현재 활성 멤버 수가 한도를 초과하지 않아야 한다
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      select: {
        memberLimit: true,
        _count: { select: { members: { where: { leftAt: null } } } },
      },
    });
    if (room?.memberLimit !== null && room!._count.members >= room!.memberLimit!) {
      throw new BadRequestException(`최대 인원(${room!.memberLimit}명)에 도달해 더 이상 초대할 수 없습니다.`);
    }

    const existing = await this.prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId: targetUserId } },
    });

    if (existing) {
      if (existing.leftAt === null) {
        throw new BadRequestException('이미 채팅방에 참여 중인 유저입니다.');
      }
      // 이전에 나간 멤버는 leftAt을 null로 초기화해 재참여 처리
      return this.prisma.roomMember.update({
        where: { roomId_userId: { roomId, userId: targetUserId } },
        data: { leftAt: null, invitedBy: requesterId },
      });
    }

    return this.prisma.roomMember.create({
      data: { roomId, userId: targetUserId, invitedBy: requesterId },
    });
  }

  /**
   * GROUP 채팅방에서 멤버를 내보낸다.
   * - OWNER는 자신을 내보낼 수 없다.
   * - OWNER는 다른 MEMBER를 내보낼 수 있다.
   * - MEMBER는 자기 자신만 내보낼 수 있다 (자진 퇴장).
   */
  async removeMember(requesterId: string, roomId: string, targetUserId: string) {
    const requesterMember = await this.prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId: requesterId } },
    });
    if (!requesterMember || requesterMember.leftAt !== null) {
      throw new ForbiddenException('채팅방에 접근 권한이 없습니다.');
    }

    const targetMember = await this.prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId: targetUserId } },
    });
    if (!targetMember || targetMember.leftAt !== null) {
      throw new NotFoundException('해당 유저는 채팅방 멤버가 아닙니다.');
    }

    const isOwner = requesterMember.role === 'OWNER';
    const isSelf = requesterId === targetUserId;

    if (isOwner && isSelf) {
      throw new BadRequestException('OWNER는 자기 자신을 내보낼 수 없습니다. 먼저 OWNER를 다른 멤버에게 넘겨주세요.');
    }

    if (!isOwner && !isSelf) {
      throw new ForbiddenException('자기 자신만 채팅방에서 나갈 수 있습니다.');
    }

    return this.prisma.roomMember.update({
      where: { roomId_userId: { roomId, userId: targetUserId } },
      data: { leftAt: new Date() },
    });
  }

  /**
   * OWNER 권한을 다른 MEMBER에게 이전한다.
   * 기존 OWNER는 MEMBER로 강등된다.
   */
  async transferOwner(requesterId: string, roomId: string, dto: TransferOwnerDto) {
    const { targetUserId } = dto;

    await this.assertOwner(requesterId, roomId);

    if (requesterId === targetUserId) {
      throw new BadRequestException('자기 자신에게 OWNER를 넘겨줄 수 없습니다.');
    }

    const targetMember = await this.prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId: targetUserId } },
    });
    if (!targetMember || targetMember.leftAt !== null) {
      throw new NotFoundException('해당 유저는 채팅방 멤버가 아닙니다.');
    }

    // 두 업데이트를 트랜잭션으로 묶어 중간 상태 없이 원자적으로 처리
    const [, newOwner] = await this.prisma.$transaction([
      this.prisma.roomMember.update({
        where: { roomId_userId: { roomId, userId: requesterId } },
        data: { role: 'MEMBER' },
      }),
      this.prisma.roomMember.update({
        where: { roomId_userId: { roomId, userId: targetUserId } },
        data: { role: 'OWNER' },
      }),
    ]);

    return newOwner;
  }

  private async assertOwner(userId: string, roomId: string) {
    const member = await this.prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
    if (!member || member.leftAt !== null) {
      throw new ForbiddenException('채팅방에 접근 권한이 없습니다.');
    }
    if (member.role !== 'OWNER') {
      throw new ForbiddenException('OWNER만 수행할 수 있는 작업입니다.');
    }
  }
}
