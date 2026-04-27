import { Body, Controller, Delete, Get, Param, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { BannerService } from './banner.service';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Banner as BannerEntity } from '../_gen/prisma-class/banner';
import { UpdateBannerDto } from './dto/update-banner.dto';

@ApiTags('banner')
@Controller('banner')
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  @Get()
  @ApiOperation({ summary: '배너 목록 조회' })
  @ApiOkResponse({
    description: '배너 목록',
    type: BannerEntity,
    isArray: true,
  })
  findAll() {
    return this.bannerService.findAll();
  }

  @Patch(':id')
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '배너 링크 수정 (ADMIN 전용)' })
  @ApiOkResponse({ description: '수정된 배너 정보', type: BannerEntity })
  update(@Param('id') id: string, @Body() dto: UpdateBannerDto) {
    return this.bannerService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '배너 삭제 (ADMIN 전용)' })
  @ApiOkResponse({ description: '삭제된 배너 정보', type: BannerEntity })
  delete(@Param('id') id: string) {
    return this.bannerService.delete(id);
  }
}
