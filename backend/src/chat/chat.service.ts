import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';
import { EditMessageDto } from './dto/edit-message.dto';
import { DeleteMessageDto } from './dto/delete-message.dto';
import { ReadMessageDto } from './dto/read-message.dto';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  /**
   * 메시지를 전송한다.
   * 전송 전에 요청자가 해당 방의 활성 멤버인지 확인한다.
   */
  async sendMessage(senderId: string, dto: SendMessageDto) {
    const { roomId, content, attachments } = dto;

    await this.assertActiveMember(senderId, roomId);

    // 메시지 저장 후 sender 정보와 첨부파일을 함께 반환해 클라이언트에서 바로 렌더링할 수 있게 한다
    return this.prisma.message.create({
      data: {
        roomId,
        senderId,
        content,
        ...(attachments?.length && {
          attachments: {
            create: attachments.map((a) => ({
              url: a.url,
              name: a.name,
              size: a.size,
              mimeType: a.mimeType,
              // mimeType 접두사로 IMAGE / FILE 타입을 구분한다
              type: a.mimeType.startsWith('image/') ? 'IMAGE' : 'FILE',
            })),
          },
        }),
      },
      include: {
        sender: { select: { id: true, name: true, image: true } },
        attachments: true,
      },
    });
  }

  /**
   * 메시지를 수정한다.
   * 본인이 보낸 메시지만 수정 가능하며, 삭제된 메시지는 수정할 수 없다.
   */
  async editMessage(userId: string, dto: EditMessageDto) {
    const { messageId, content } = dto;

    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message || message.deletedAt !== null) {
      throw new NotFoundException('메시지를 찾을 수 없습니다.');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('본인이 보낸 메시지만 수정할 수 있습니다.');
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: { content, isEdited: true },
      include: {
        sender: { select: { id: true, name: true, image: true } },
      },
    });
  }

  /**
   * 메시지를 soft delete 처리한다.
   * 본인 메시지 또는 채팅방 OWNER만 삭제 가능하다.
   */
  async deleteMessage(userId: string, dto: DeleteMessageDto) {
    const { messageId } = dto;

    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message || message.deletedAt !== null) {
      throw new NotFoundException('메시지를 찾을 수 없습니다.');
    }

    const isSender = message.senderId === userId;

    if (!isSender) {
      // 본인 메시지가 아닐 경우, 해당 방의 OWNER인지 확인
      const member = await this.prisma.roomMember.findUnique({
        where: { roomId_userId: { roomId: message.roomId, userId } },
      });
      if (!member || member.role !== 'OWNER') {
        throw new ForbiddenException(
          '본인 메시지 또는 방장만 삭제할 수 있습니다.',
        );
      }
    }

    // 물리 삭제 대신 deletedAt을 기록해 "삭제된 메시지입니다" 표시 등에 활용할 수 있게 한다
    return this.prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * 읽음 상태를 업데이트한다.
   * RoomMember의 lastReadAt을 갱신해 안 읽은 메시지 수를 계산하는 데 활용한다.
   */
  async markAsRead(userId: string, dto: ReadMessageDto) {
    const { roomId, lastMessageId } = dto;

    // 마지막으로 읽은 메시지의 생성 시각을 lastReadAt으로 저장한다
    const message = await this.prisma.message.findUnique({
      where: { id: lastMessageId },
      select: { createdAt: true },
    });

    if (!message) {
      throw new NotFoundException('메시지를 찾을 수 없습니다.');
    }

    return this.prisma.roomMember.update({
      where: { roomId_userId: { roomId, userId } },
      data: { lastReadAt: message.createdAt },
    });
  }

  /**
   * 채팅방의 메시지 목록을 페이지네이션으로 조회한다.
   * cursor 기반으로 동작해 무한 스크롤(과거 메시지 불러오기)에 적합하다.
   */
  async getMessages(
    userId: string,
    roomId: string,
    cursor?: string,
    take = 50,
  ) {
    await this.assertActiveMember(userId, roomId);

    return this.prisma.message.findMany({
      where: { roomId },
      orderBy: { createdAt: 'desc' },
      take,
      // cursor가 있으면 해당 메시지 이전 메시지들을 가져온다 (더 불러오기)
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      include: {
        sender: { select: { id: true, name: true, image: true } },
        attachments: true,
      },
    });
  }

  /**
   * 채팅방의 활성 멤버 userId 목록을 반환한다.
   * 새 메시지 발생 시 각 멤버의 개인 채널(user:<userId>)로 room-list-updated를 보내는 데 사용한다.
   */
  async getActiveMemberIds(roomId: string): Promise<string[]> {
    const members = await this.prisma.roomMember.findMany({
      where: { roomId, leftAt: null },
      select: { userId: true },
    });
    return members.map((m) => m.userId);
  }

  /**
   * 요청자가 해당 방의 활성 멤버(leftAt === null)인지 검증한다.
   * WebSocket 이벤트 처리 전 공통으로 호출해 권한을 체크한다.
   */
  private async assertActiveMember(userId: string, roomId: string) {
    const member = await this.prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });

    if (!member || member.leftAt !== null) {
      throw new ForbiddenException('채팅방에 접근 권한이 없습니다.');
    }
  }
}
