import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBannerDto } from './dto/create-banner.dto';

@Injectable()
export class BannerService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateBannerDto) {
    return this.prisma.banner.create({ data: dto });
  }

  async findAll() {
    return this.prisma.banner.findMany({ orderBy: { createdAt: 'asc' } });
  }

  async delete(id: string) {
    const banner = await this.prisma.banner.findUnique({ where: { id } });

    if (!banner) {
      throw new NotFoundException('배너를 찾을 수 없습니다.');
    }

    return this.prisma.banner.delete({ where: { id } });
  }
}
