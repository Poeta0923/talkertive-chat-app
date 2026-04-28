import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from 'src/prisma/prisma.service';
import { Banner } from 'generated/prisma';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { MediaService } from '../media/media.service';

const BANNER_ALL_KEY = 'banner:all';
// 배너는 자주 바뀌지 않는 정적 콘텐츠이므로 5분 TTL 적용
const BANNER_TTL_MS = 300_000;

@Injectable()
export class BannerService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cache: Cache,
    private media: MediaService,
  ) {}

  async findAll(): Promise<Banner[]> {
    const cached = await this.cache.get<Banner[]>(BANNER_ALL_KEY);
    if (cached) return cached;

    const result = await this.prisma.banner.findMany({
      orderBy: { createdAt: 'asc' },
    });
    await this.cache.set(BANNER_ALL_KEY, result, BANNER_TTL_MS);
    return result;
  }

  async update(id: string, dto: UpdateBannerDto): Promise<Banner> {
    const banner = await this.prisma.banner.findUnique({ where: { id } });
    if (!banner) throw new NotFoundException('배너를 찾을 수 없습니다.');

    const updated = await this.prisma.banner.update({ where: { id }, data: dto });
    await this.cache.del(BANNER_ALL_KEY);
    return updated;
  }

  async delete(id: string): Promise<Banner> {
    const banner = await this.prisma.banner.findUnique({ where: { id } });

    if (!banner) {
      throw new NotFoundException('배너를 찾을 수 없습니다.');
    }

    await this.media.deleteIfExists(banner.imageUrl);
    const deleted = await this.prisma.banner.delete({ where: { id } });
    // 삭제 후 캐시 무효화 — 다음 GET /banner 요청에서 DB를 새로 조회
    await this.cache.del(BANNER_ALL_KEY);
    return deleted;
  }
}
