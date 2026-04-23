import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from 'src/prisma/prisma.service';
import { AiScheduleRequestDto } from './dto/ai-schedule-request.dto';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { RoomSchedule } from 'generated/prisma';

// Claude가 반환하는 JSON 구조 타입
type ClaudeScheduleAdd = { type: '일정 추가'; name: string; date: string };
type ClaudeScheduleUpdate = { type: '일정 변경'; name: string; date: string; changedDate: string };
type ClaudeScheduleCancel = { type: '일정 취소'; name: string; date: string };
type ClaudeScheduleError = { error: 'no_match' };
type ClaudeScheduleResult =
  | ClaudeScheduleAdd
  | ClaudeScheduleUpdate
  | ClaudeScheduleCancel
  | ClaudeScheduleError;

// "YYYY-MM-DD HH:mm" → Date 변환
function parseClaudeDate(dateStr: string): Date {
  return new Date(dateStr.replace(' ', 'T') + ':00');
}

// KST 기준 요일 이름 반환
function getWeekdayName(date: Date): string {
  const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  return days[date.getDay()];
}

// Date → "YYYY-MM-DD HH:mm" 포맷
function formatDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

@Injectable()
export class SchedulesService {
  private readonly anthropic: Anthropic;

  constructor(private prisma: PrismaService) {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * 사용자가 활성 멤버로 참여 중인 모든 GROUP 방의 일정을 반환한다.
   */
  async findMySchedules(userId: string): Promise<(RoomSchedule & { roomName: string | null })[]> {
    const schedules = await this.prisma.roomSchedule.findMany({
      where: {
        room: {
          type: 'GROUP',
          members: {
            some: { userId, leftAt: null },
          },
        },
      },
      include: {
        room: { select: { name: true } },
      },
      orderBy: { time: 'asc' },
    });

    return schedules.map(({ room, ...schedule }) => ({
      ...schedule,
      roomName: room.name,
    }));
  }

  /**
   * 특정 GROUP 방의 일정 목록을 반환한다.
   */
  async findRoomSchedules(roomId: string): Promise<RoomSchedule[]> {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId, type: 'GROUP' },
    });

    if (!room) {
      throw new NotFoundException('채팅방을 찾을 수 없습니다.');
    }

    return this.prisma.roomSchedule.findMany({
      where: { roomId },
      orderBy: { time: 'asc' },
    });
  }

  /**
   * 특정 GROUP 방에 일정을 추가한다. OWNER만 실행할 수 있다.
   */
  async createSchedule(userId: string, roomId: string, dto: CreateScheduleDto): Promise<RoomSchedule> {
    await this.assertOwner(userId, roomId);

    return this.prisma.roomSchedule.create({
      data: {
        roomId,
        name: dto.name,
        time: new Date(dto.time),
      },
    });
  }

  /**
   * 일정을 수정한다. 해당 방의 OWNER만 실행할 수 있다.
   */
  async updateSchedule(
    userId: string,
    roomId: string,
    scheduleId: string,
    dto: UpdateScheduleDto,
  ): Promise<RoomSchedule> {
    await this.assertOwner(userId, roomId);
    await this.assertScheduleExists(scheduleId, roomId);

    return this.prisma.roomSchedule.update({
      where: { id: scheduleId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.time && { time: new Date(dto.time) }),
      },
    });
  }

  /**
   * 일정을 삭제한다. 해당 방의 OWNER만 실행할 수 있다.
   */
  async deleteSchedule(userId: string, roomId: string, scheduleId: string): Promise<void> {
    await this.assertOwner(userId, roomId);
    await this.assertScheduleExists(scheduleId, roomId);

    await this.prisma.roomSchedule.delete({ where: { id: scheduleId } });
  }

  // roomId 기준으로 OWNER 여부를 확인하는 공통 헬퍼
  private async assertOwner(userId: string, roomId: string): Promise<void> {
    const member = await this.prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });

    if (!member) {
      throw new NotFoundException('채팅방을 찾을 수 없습니다.');
    }

    if (member.role !== 'OWNER') {
      throw new ForbiddenException('방장만 일정을 관리할 수 있습니다.');
    }
  }

  // 일정이 해당 방에 속하는지 확인하는 공통 헬퍼
  private async assertScheduleExists(scheduleId: string, roomId: string): Promise<void> {
    const schedule = await this.prisma.roomSchedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule || schedule.roomId !== roomId) {
      throw new NotFoundException('일정을 찾을 수 없습니다.');
    }
  }

  /**
   * Claude AI를 통해 자연어 요청을 파싱하고 일정을 추가/변경/취소한다.
   * 해당 GROUP 방의 OWNER만 실행할 수 있다.
   */
  async processAiSchedule(
    userId: string,
    roomId: string,
    dto: AiScheduleRequestDto,
  ): Promise<RoomSchedule> {
    await this.assertOwner(userId, roomId);

    // 해당 방의 기존 일정 목록 조회
    const existingSchedules = await this.prisma.roomSchedule.findMany({
      where: { roomId },
      orderBy: { time: 'asc' },
    });

    const scheduleArray = existingSchedules.map((s) => ({
      id: s.id,
      name: s.name,
      date: formatDate(s.time),
    }));

    const today = new Date();
    const todayStr = formatDate(today).split(' ')[0];
    const weekday = getWeekdayName(today);

    // AI가 요일→날짜 변환을 직접 계산하지 않도록 앞으로 14일의 매핑을 명시적으로 제공한다
    const weekdayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const upcomingDates = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
      return `${weekdayNames[d.getDay()]}(${i === 0 ? '오늘' : `+${i}일`}): ${formatDate(d).split(' ')[0]}`;
    }).join('\n');

    // 프롬프트 템플릿 조립
    const prompt = `You are a schedule parser for a Korean scheduling app.
Extract structured data from the user's request and return ONLY a valid JSON object. No explanation, no markdown, no extra text.

<action_type>
${dto.actionType}
</action_type>

<schedule_array>
${JSON.stringify(scheduleArray, null, 2)}
</schedule_array>

<user_request>
${dto.userRequest}
</user_request>

<date_reference>
Today is ${todayStr} (${weekday}). Use the exact dates below — do NOT calculate dates yourself:
${upcomingDates}
</date_reference>

Rules:
- All user input will be in Korean. Parse accordingly.
- Return ONLY a JSON object, nothing else.
- All dates must be in "YYYY-MM-DD HH:mm" format.
- If no time is specified, use "HH:mm" as "00:00".
- Always look up weekday names in <date_reference> to get the correct date. Never compute dates independently.
- For 일정 변경/취소, match the target schedule from schedule_array by name or date proximity.
- If no matching schedule is found, set "error": "no_match".

Return format by action_type:

일정 추가:
{"type":"일정 추가","name":"string","date":"YYYY-MM-DD HH:mm"}

일정 변경:
{"type":"일정 변경","name":"string","date":"YYYY-MM-DD HH:mm","changedDate":"YYYY-MM-DD HH:mm"}

일정 취소:
{"type":"일정 취소","name":"string","date":"YYYY-MM-DD HH:mm"}`;

    // Claude API 호출
    const message = await this.anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 20000,
      temperature: 1,
      thinking: { type: 'disabled' },
      messages: [
        {
          role: 'user',
          content: [{ type: 'text', text: prompt }],
        },
      ],
    });

    const rawText = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('');

    // 마크다운 코드블록(```json ... ``` 또는 ``` ... ```)을 제거한다
    const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

    let parsed: ClaudeScheduleResult;
    try {
      parsed = JSON.parse(cleaned) as ClaudeScheduleResult;
    } catch {
      throw new InternalServerErrorException('AI 응답 파싱에 실패했습니다.');
    }

    if ('error' in parsed && parsed.error === 'no_match') {
      throw new NotFoundException('일치하는 일정을 찾을 수 없습니다.');
    }

    return this.applyScheduleAction(roomId, parsed as Exclude<ClaudeScheduleResult, ClaudeScheduleError>, existingSchedules);
  }

  private async applyScheduleAction(
    roomId: string,
    result: Exclude<ClaudeScheduleResult, ClaudeScheduleError>,
    existingSchedules: RoomSchedule[],
  ): Promise<RoomSchedule> {
    if (result.type === '일정 추가') {
      return this.prisma.roomSchedule.create({
        data: {
          roomId,
          name: result.name,
          time: parseClaudeDate(result.date),
        },
      });
    }

    if (result.type === '일정 변경') {
      // name + date로 기존 일정 매칭
      const target = this.findMatchingSchedule(existingSchedules, result.name, result.date);

      if (!target) {
        throw new NotFoundException('변경할 일정을 찾을 수 없습니다.');
      }

      return this.prisma.roomSchedule.update({
        where: { id: target.id },
        data: {
          name: result.name,
          time: parseClaudeDate(result.changedDate),
        },
      });
    }

    if (result.type === '일정 취소') {
      const target = this.findMatchingSchedule(existingSchedules, result.name, result.date);

      if (!target) {
        throw new NotFoundException('취소할 일정을 찾을 수 없습니다.');
      }

      return this.prisma.roomSchedule.delete({
        where: { id: target.id },
      });
    }

    throw new BadRequestException('알 수 없는 액션 타입입니다.');
  }

  // 이름과 날짜로 가장 근접한 일정을 찾는다
  private findMatchingSchedule(
    schedules: RoomSchedule[],
    name: string,
    dateStr: string,
  ): RoomSchedule | undefined {
    const targetTime = parseClaudeDate(dateStr).getTime();

    // 이름이 일치하는 것 중 날짜가 가장 가까운 항목을 선택
    const nameMatches = schedules.filter((s) => s.name === name);
    if (nameMatches.length > 0) {
      return nameMatches.reduce((closest, current) => {
        const closestDiff = Math.abs(closest.time.getTime() - targetTime);
        const currentDiff = Math.abs(current.time.getTime() - targetTime);
        return currentDiff < closestDiff ? current : closest;
      });
    }

    // 이름 불일치 시 날짜로만 가장 가까운 항목을 선택
    return schedules.reduce(
      (closest, current) => {
        if (!closest) return current;
        const closestDiff = Math.abs(closest.time.getTime() - targetTime);
        const currentDiff = Math.abs(current.time.getTime() - targetTime);
        return currentDiff < closestDiff ? current : closest;
      },
      undefined as RoomSchedule | undefined,
    );
  }
}
