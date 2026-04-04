import { User as _User } from './user';
import { Account as _Account } from './account';
import { Session as _Session } from './session';
import { VerificationToken as _VerificationToken } from './verification_token';
import { Room as _Room } from './room';
import { RoomLike as _RoomLike } from './room_like';
import { RoomMember as _RoomMember } from './room_member';
import { Message as _Message } from './message';
import { MessageAttachment as _MessageAttachment } from './message_attachment';
import { MessageRead as _MessageRead } from './message_read';

export namespace PrismaModel {
  export class User extends _User {}
  export class Account extends _Account {}
  export class Session extends _Session {}
  export class VerificationToken extends _VerificationToken {}
  export class Room extends _Room {}
  export class RoomLike extends _RoomLike {}
  export class RoomMember extends _RoomMember {}
  export class Message extends _Message {}
  export class MessageAttachment extends _MessageAttachment {}
  export class MessageRead extends _MessageRead {}

  export const extraModels = [
    User,
    Account,
    Session,
    VerificationToken,
    Room,
    RoomLike,
    RoomMember,
    Message,
    MessageAttachment,
    MessageRead,
  ];
}
