import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { WsJwtGuard } from './ws-jwt.guard';
import { SendMessageDto } from './dto/send-message.dto';
import { EditMessageDto } from './dto/edit-message.dto';
import { DeleteMessageDto } from './dto/delete-message.dto';
import { ReadMessageDto } from './dto/read-message.dto';

/**
 * ChatGateway — 실시간 채팅을 처리하는 WebSocket 게이트웨이.
 *
 * @WebSocketGateway 데코레이터 옵션:
 *   - namespace: '/chat' — HTTP API(/rooms 등)와 네임스페이스를 분리해 관심사를 명확히 한다.
 *   - cors: 개발 환경에서 프론트엔드(localhost:3000)의 연결을 허용한다.
 *
 * socket.io의 "룸(room)" 개념을 활용한다.
 * socket.io 룸은 서버 메모리에서 관리되는 논리적 그룹이다.
 * 클라이언트가 join('room:<roomId>')하면 해당 그룹에 속하고,
 * server.to('room:<roomId>').emit(...)으로 그룹 전체에 이벤트를 브로드캐스트할 수 있다.
 */
@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : true,
    credentials: true,
  },
})
// WsJwtGuard를 클래스 레벨에 적용해 모든 이벤트 핸들러에서 인증을 강제한다
@UseGuards(WsJwtGuard)
// ValidationPipe를 WebSocket 이벤트에도 적용해 DTO 유효성 검사를 수행한다
@UsePipes(new ValidationPipe({ whitelist: true }))
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  /**
   * @WebSocketServer — NestJS가 Socket.io Server 인스턴스를 자동으로 주입한다.
   * 이 인스턴스로 특정 룸이나 모든 클라이언트에게 이벤트를 emit할 수 있다.
   */
  @WebSocketServer()
  server: Server;

  constructor(
    private chatService: ChatService,
    // WsJwtGuard에서 JwtService를 사용하므로 Gateway에서 함께 주입한다
    private jwtService: JwtService,
  ) {}

  /**
   * 클라이언트가 WebSocket 연결을 맺을 때 자동으로 호출된다.
   * OnGatewayConnection 인터페이스를 구현함으로써 연결 시 초기화 로직을 처리한다.
   *
   * 연결 직후에는 WsJwtGuard가 아직 동작하지 않으므로,
   * handleConnection에서 직접 토큰을 검증해야 한다.
   */
  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string) ||
        client.handshake.headers?.authorization?.slice(7);

      if (!token) throw new Error('토큰 없음');

      const payload = this.jwtService.verify(token, {
        secret: process.env.AUTH_SECRET,
      });

      // 검증된 사용자 정보를 socket.data에 저장해 이후 모든 이벤트에서 재사용한다
      client.data.user = payload;
      console.log(`[Chat] 연결됨: userId=${payload.sub}, socketId=${client.id}`);
    } catch {
      // 인증 실패 시 연결을 즉시 끊는다
      console.log(`[Chat] 인증 실패로 연결 해제: socketId=${client.id}`);
      client.disconnect();
    }
  }

  /**
   * 클라이언트가 연결을 끊을 때 자동으로 호출된다.
   * socket.io가 자동으로 해당 소켓이 속한 모든 룸에서 제거하므로
   * 별도로 룸에서 leave를 호출할 필요가 없다.
   */
  handleDisconnect(client: Socket) {
    console.log(`[Chat] 연결 해제: userId=${client.data.user?.sub}, socketId=${client.id}`);
  }

  /**
   * 클라이언트가 채팅방에 입장한다.
   *
   * 클라이언트 이벤트: 'join-room'
   * payload: { roomId: string }
   *
   * client.join(roomName) — socket.io 내장 메서드로,
   * 이 소켓을 'room:<roomId>' 그룹에 추가한다.
   * 이후 server.to('room:<roomId>').emit(...)을 호출하면 이 소켓도 수신한다.
   */
  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    const userId = client.data.user.sub as string;
    const { roomId } = data;

    // socket.io 룸 이름은 임의 문자열이며, 'room:' 접두사로 채팅방 ID와 구분한다
    const roomName = `room:${roomId}`;
    await client.join(roomName);

    // 입장한 사용자의 최근 메시지 50개를 응답으로 돌려준다
    const messages = await this.chatService.getMessages(userId, roomId);

    // NestJS WebSocket 응답 포맷: { event, data } — data 키에 담아야 클라이언트에 올바르게 전달된다
    return { event: 'room-joined', data: { messages } };
  }

  /**
   * 클라이언트가 채팅방에서 퇴장한다.
   *
   * 클라이언트 이벤트: 'leave-room'
   * payload: { roomId: string }
   */
  @SubscribeMessage('leave-room')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    client.leave(`room:${data.roomId}`);
    return { event: 'room-left', data: {} };
  }

  /**
   * 메시지를 전송한다.
   *
   * 클라이언트 이벤트: 'send-message'
   * 서버 브로드캐스트: 'new-message' — 같은 룸의 모든 클라이언트(발신자 포함)에게 전달
   */
  @SubscribeMessage('send-message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SendMessageDto,
  ) {
    const userId = client.data.user.sub as string;

    const message = await this.chatService.sendMessage(userId, dto);

    // server.to(roomName).emit — 해당 룸에 입장한 모든 소켓에게 이벤트를 보낸다
    // client.to(roomName).emit — 발신자를 제외한 나머지에게만 보낸다
    // 발신자도 UI를 서버 기준으로 동기화해야 하므로 server.to를 사용한다
    this.server.to(`room:${dto.roomId}`).emit('new-message', message);

    return { event: 'message-sent', data: { message } };
  }

  /**
   * 메시지를 수정한다.
   *
   * 클라이언트 이벤트: 'edit-message'
   * 서버 브로드캐스트: 'message-edited' — 같은 룸의 모든 클라이언트에게 전달
   */
  @SubscribeMessage('edit-message')
  async handleEditMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: EditMessageDto,
  ) {
    const userId = client.data.user.sub as string;

    const message = await this.chatService.editMessage(userId, dto);

    this.server.to(`room:${message.roomId}`).emit('message-edited', message);

    return { event: 'message-edit-success', data: { message } };
  }

  /**
   * 메시지를 삭제한다.
   *
   * 클라이언트 이벤트: 'delete-message'
   * 서버 브로드캐스트: 'message-deleted' — 같은 룸의 모든 클라이언트에게 전달
   * 클라이언트는 messageId를 받아 해당 메시지를 "삭제된 메시지입니다"로 교체한다.
   */
  @SubscribeMessage('delete-message')
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: DeleteMessageDto,
  ) {
    const userId = client.data.user.sub as string;

    const message = await this.chatService.deleteMessage(userId, dto);

    // 삭제 시에는 전체 메시지 객체 대신 ID만 전달해도 충분하다
    this.server.to(`room:${message.roomId}`).emit('message-deleted', {
      messageId: message.id,
      roomId: message.roomId,
    });

    return { event: 'message-delete-success', data: {} };
  }

  /**
   * 읽음 상태를 업데이트한다.
   *
   * 클라이언트 이벤트: 'read-message'
   * 서버 브로드캐스트: 'message-read' — 같은 룸의 다른 멤버들에게 읽음 정보를 전달해
   *   "OO님이 읽음" 등의 UI 업데이트에 활용한다.
   */
  @SubscribeMessage('read-message')
  async handleReadMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: ReadMessageDto,
  ) {
    const userId = client.data.user.sub as string;

    await this.chatService.markAsRead(userId, dto);

    // 발신자를 제외한 같은 룸의 멤버들에게 읽음 정보를 전달한다
    client.to(`room:${dto.roomId}`).emit('message-read', {
      userId,
      roomId: dto.roomId,
      lastMessageId: dto.lastMessageId,
    });

    return { event: 'read-success', data: {} };
  }

  /**
   * 타이핑 인디케이터를 브로드캐스트한다.
   *
   * 클라이언트 이벤트: 'typing'
   * 서버 브로드캐스트: 'user-typing' — 발신자 제외 같은 룸의 멤버들에게 전달
   * DB 저장 없이 실시간으로만 처리한다.
   */
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; isTyping: boolean },
  ) {
    const userId = client.data.user.sub as string;

    // client.to — 발신자를 제외하고 브로드캐스트
    client.to(`room:${data.roomId}`).emit('user-typing', {
      userId,
      isTyping: data.isTyping,
    });
  }
}
