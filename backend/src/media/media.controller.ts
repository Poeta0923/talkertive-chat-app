/// <reference types="multer" />
import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  applyDecorators,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MediaService } from './media.service';

const FILE_SIZE_LIMIT = 100 * 1024 * 1024; // 100MB

const IMAGE_INTERCEPTOR_OPTIONS = {
  limits: { fileSize: FILE_SIZE_LIMIT },
  fileFilter: (_req: unknown, file: Express.Multer.File, cb: (error: Error | null, accept: boolean) => void) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new BadRequestException('이미지 파일만 업로드 가능합니다.'), false);
    }
    cb(null, true);
  },
};

// 허용 MIME 타입: 이미지 + 문서 (pdf, doc, xls 등)
const ALLOWED_ATTACHMENT_MIMETYPES = [
  'image/',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const ATTACHMENT_INTERCEPTOR_OPTIONS = {
  limits: { fileSize: FILE_SIZE_LIMIT },
  fileFilter: (_req: unknown, file: Express.Multer.File, cb: (error: Error | null, accept: boolean) => void) => {
    const isAllowed = ALLOWED_ATTACHMENT_MIMETYPES.some((type) => file.mimetype.startsWith(type));
    if (!isAllowed) {
      return cb(new BadRequestException('지원하지 않는 파일 형식입니다.'), false);
    }
    cb(null, true);
  },
};

// 파일 하나만 받는 엔드포인트용 Swagger 데코레이터 묶음
function ApiFileUpload(summary: string, description: string) {
  return applyDecorators(
    ApiOperation({ summary }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          file: { type: 'string', format: 'binary', description },
        },
        required: ['file'],
      },
    }),
    ApiOkResponse({ description: 'DB에 저장된 업데이트 결과' }),
    ApiBearerAuth('access-token'),
  );
}

@ApiTags('media')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('users/profile')
  @UseGuards(AccessTokenGuard)
  @UseInterceptors(FileInterceptor('file', IMAGE_INTERCEPTOR_OPTIONS))
  @ApiFileUpload('유저 프로필 이미지 업로드', '프로필 이미지 (jpg, png 등)')
  async uploadUserProfile(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    if (!file) throw new BadRequestException('파일이 없습니다');
    return this.mediaService.uploadUserProfile(file, req.user!.sub);
  }

  @Post('rooms/:roomId/cover')
  @UseGuards(AccessTokenGuard)
  @UseInterceptors(FileInterceptor('file', IMAGE_INTERCEPTOR_OPTIONS))
  @ApiFileUpload('모임 커버 이미지 업로드', '커버 이미지 (jpg, png 등)')
  async uploadRoomCover(
    @UploadedFile() file: Express.Multer.File,
    @Param('roomId') roomId: string,
    @Req() req: Request,
  ) {
    if (!file) throw new BadRequestException('파일이 없습니다');
    return this.mediaService.uploadRoomCover(file, roomId, req.user!.sub);
  }

  @Post('rooms/:roomId/profile')
  @UseGuards(AccessTokenGuard)
  @UseInterceptors(FileInterceptor('file', IMAGE_INTERCEPTOR_OPTIONS))
  @ApiFileUpload('모임 프로필 이미지 업로드', '프로필 이미지 (jpg, png 등)')
  async uploadRoomProfile(
    @UploadedFile() file: Express.Multer.File,
    @Param('roomId') roomId: string,
    @Req() req: Request,
  ) {
    if (!file) throw new BadRequestException('파일이 없습니다');
    return this.mediaService.uploadRoomProfile(file, roomId, req.user!.sub);
  }

  @Post('banners')
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('ADMIN')
  @UseInterceptors(FileInterceptor('file', IMAGE_INTERCEPTOR_OPTIONS))
  @ApiOperation({ summary: '배너 이미지 업로드 + 배너 생성 (ADMIN 전용)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: '배너 이미지 (jpg, png 등)' },
        linkUrl: { type: 'string', description: '배너 클릭 시 이동할 URL' },
      },
      required: ['file', 'linkUrl'],
    },
  })
  @ApiOkResponse({ description: '생성된 Banner 레코드' })
  @ApiBearerAuth('access-token')
  async uploadBanner(
    @UploadedFile() file: Express.Multer.File,
    @Body('linkUrl') linkUrl: string,
  ) {
    if (!file) throw new BadRequestException('파일이 없습니다');
    if (!linkUrl) throw new BadRequestException('linkUrl이 없습니다');
    return this.mediaService.uploadBanner(file, linkUrl);
  }

  @Post('messages/:roomId')
  @UseGuards(AccessTokenGuard)
  @UseInterceptors(FileInterceptor('file', ATTACHMENT_INTERCEPTOR_OPTIONS))
  @ApiFileUpload('메시지 첨부파일 업로드', '이미지 또는 파일')
  @ApiOkResponse({ description: '{ url: string } — 메시지 전송 시 함께 사용' })
  async uploadMessageAttachment(
    @UploadedFile() file: Express.Multer.File,
    @Param('roomId') roomId: string,
  ) {
    if (!file) throw new BadRequestException('파일이 없습니다');
    return this.mediaService.uploadMessageAttachment(file, roomId);
  }
}
