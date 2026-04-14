import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from 'generated/prisma';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * 토큰 기준으로 본인 정보를 조회한다.
   */
  async getMe(userId: string): Promise<Omit<User, 'hashedPassword'>> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('유저를 찾을 수 없습니다.');
    }

    const { hashedPassword: _, ...rest } = user;
    return rest;
  }

  /**
   * 유저 정보를 수정한다. 본인만 수정 가능하다.
   */
  async updateMe(requesterId: string, targetId: string, dto: UpdateUserDto): Promise<Omit<User, 'hashedPassword'>> {
    if (requesterId !== targetId) {
      throw new ForbiddenException('본인의 정보만 수정할 수 있습니다.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: targetId } });

    if (!user) {
      throw new NotFoundException('유저를 찾을 수 없습니다.');
    }

    const { hashedPassword: _, ...updated } = await this.prisma.user.update({
      where: { id: targetId },
      data: dto,
    });

    return updated;
  }
}
