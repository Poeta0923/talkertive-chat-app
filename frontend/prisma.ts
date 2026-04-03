import { PrismaClient } from "@/generated/prisma";

// Next.js 개발 환경의 핫리로드 시 PrismaClient 인스턴스가 중복 생성되는 것을 방지
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
