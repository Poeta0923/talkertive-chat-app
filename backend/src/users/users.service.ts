import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from 'generated/prisma';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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
