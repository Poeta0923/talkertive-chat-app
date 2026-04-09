/// <reference types="multer" />
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuid } from 'uuid';

@Injectable()
export class MediaService {
  private s3Client: S3Client;
  private cloudFrontDomain: string;

  constructor(private readonly prisma: PrismaService) {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
    this.cloudFrontDomain = process.env.CLOUDFRONT_DOMAIN!;
  }

  /**
   * S3 업로드 공통 로직. 모든 public 업로드 메서드가 이 메서드를 통해 처리된다.
   * @param file - Multer MemoryStorage 파일 객체
   * @param key  - S3 오브젝트 키 (경로 포함)
   * @returns CloudFront URL
   */
  private async upload(file: Express.Multer.File, key: string): Promise<string> {
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_MEDIA_S3_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );
    return this.getMediaUrl(key);
  }

  getMediaUrl(key: string) {
    return `https://${this.cloudFrontDomain}/${key}`;
  }

  private buildKey(prefix: string, originalname: string) {
    const ext = originalname.split('.').pop();
    return `${prefix}/${uuid()}.${ext}`;
  }

  /**
   * CloudFront URL에서 S3 키를 추출해 기존 오브젝트를 삭제한다.
   * url이 null이거나 현재 도메인과 다른 외부 URL이면 삭제를 건너뛴다.
   */
  private async deleteIfExists(url: string | null) {
    if (!url || !url.startsWith(`https://${this.cloudFrontDomain}/`)) return;
    const key = url.replace(`https://${this.cloudFrontDomain}/`, '');
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_MEDIA_S3_BUCKET_NAME,
        Key: key,
      }),
    );
  }

  /**
   * 유저 프로필 이미지 업로드 후 User.image 업데이트
   * S3 경로: users/{userId}/profile/{uuid}.{ext}
   */
  async uploadUserProfile(file: Express.Multer.File, userId: string) {
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { image: true },
    });
    await this.deleteIfExists(existing?.image ?? null);
    const url = await this.upload(file, this.buildKey(`users/${userId}/profile`, file.originalname));
    return this.prisma.user.update({
      where: { id: userId },
      data: { image: url },
      select: { id: true, name: true, email: true, image: true },
    });
  }

  /**
   * 모임 커버 이미지 업로드 후 Room.coverImage 업데이트
   * S3 경로: rooms/{roomId}/cover/{uuid}.{ext}
   */
  async uploadRoomCover(file: Express.Multer.File, roomId: string, userId: string) {
    await this.assertRoomOwner(roomId, userId);
    const existing = await this.prisma.room.findUnique({
      where: { id: roomId },
      select: { coverImage: true },
    });
    await this.deleteIfExists(existing?.coverImage ?? null);
    const url = await this.upload(file, this.buildKey(`rooms/${roomId}/cover`, file.originalname));
    return this.prisma.room.update({
      where: { id: roomId },
      data: { coverImage: url },
    });
  }

  /**
   * 모임 프로필 이미지 업로드 후 Room.profileImage 업데이트
   * S3 경로: rooms/{roomId}/profile/{uuid}.{ext}
   */
  async uploadRoomProfile(file: Express.Multer.File, roomId: string, userId: string) {
    await this.assertRoomOwner(roomId, userId);
    const existing = await this.prisma.room.findUnique({
      where: { id: roomId },
      select: { profileImage: true },
    });
    await this.deleteIfExists(existing?.profileImage ?? null);
    const url = await this.upload(file, this.buildKey(`rooms/${roomId}/profile`, file.originalname));
    return this.prisma.room.update({
      where: { id: roomId },
      data: { profileImage: url },
    });
  }

  /** 요청자가 해당 방의 OWNER인지 확인한다. 아니면 예외를 던진다. */
  private async assertRoomOwner(roomId: string, userId: string) {
    const member = await this.prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });

    if (!member) {
      throw new NotFoundException('채팅방을 찾을 수 없습니다.');
    }

    if (member.role !== 'OWNER') {
      throw new ForbiddenException('방장만 이미지를 변경할 수 있습니다.');
    }
  }

  /**
   * 배너 이미지 업로드 후 Banner 레코드 생성 (ADMIN 전용)
   * S3 경로: banners/{uuid}.{ext}
   */
  async uploadBanner(file: Express.Multer.File, linkUrl: string) {
    const url = await this.upload(file, this.buildKey('banners', file.originalname));
    return this.prisma.banner.create({
      data: { imageUrl: url, linkUrl },
    });
  }

  /**
   * 메시지 첨부파일 업로드 후 CloudFront URL 반환 (메시지 전송 시 별도 저장)
   * S3 경로: messages/{roomId}/{uuid}.{ext}
   */
  async uploadMessageAttachment(file: Express.Multer.File, roomId: string) {
    const url = await this.upload(file, this.buildKey(`messages/${roomId}`, file.originalname));
    return { url };
  }
}
