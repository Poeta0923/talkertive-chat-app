import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { comparePassword } from "./lib/password-utils";
import * as jwt from "jsonwebtoken";
import { JWT } from "next-auth/jwt";

// IP당 15분 내 5회 초과 시 차단 (단일 인스턴스 기준 — 다중 인스턴스라면 Redis로 교체 필요)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

function checkLoginRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return true;
  }
  if (record.count >= MAX_LOGIN_ATTEMPTS) return false;
  record.count++;
  return true;
}

function resetLoginRateLimit(ip: string) {
  loginAttempts.delete(ip);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  useSecureCookies: process.env.NODE_ENV === "production",
  trustHost: true,
  // 커스텀 Prisma 출력 경로(generated/prisma)와 @auth/prisma-adapter가 기대하는 @prisma/client 타입 간 명목적 불일치 우회
  adapter: PrismaAdapter(prisma as any),
  secret: process.env.AUTH_SECRET,
  providers: [
    // Google OAuth — Account 테이블에 provider 정보가 저장되고 User와 연결됨
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: {
          label: "이메일",
          type: "email",
          placeholder: "이메일 입력",
        },
        password: {
          label: "비밀번호",
          type: "password",
        },
      },
      async authorize(credentials, request) {
        const ip =
          (request as Request | undefined)?.headers?.get('x-forwarded-for')?.split(',')[0].trim() ??
          (request as Request | undefined)?.headers?.get('x-real-ip') ??
          'unknown';

        if (!checkLoginRateLimit(ip)) {
          throw new Error('로그인 시도 횟수를 초과했습니다. 15분 후 다시 시도해주세요.');
        }

        if (!credentials || !credentials.email || !credentials.password) {
          throw new Error("이메일과 비밀번호를 입력해주세요.");
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email as string,
          },
        });

        // 이메일 존재 여부를 노출하지 않기 위해 두 경우 모두 동일한 메시지 반환
        const AUTH_ERROR = "이메일 또는 비밀번호가 올바르지 않습니다.";

        if (!user || !user.hashedPassword) {
          throw new Error(AUTH_ERROR);
        }

        const passwordMatch = await comparePassword(
          credentials.password as string,
          user.hashedPassword,
        );

        if (!passwordMatch) {
          throw new Error(AUTH_ERROR);
        }

        resetLoginRateLimit(ip);
        return user;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  // NestJS 백엔드와 JWT 형식을 공유하기 위해 jsonwebtoken으로 직접 인코딩/디코딩
  jwt: {
    encode: async ({ token, secret }) => {
      return jwt.sign(token as jwt.JwtPayload, secret as string, { expiresIn: '7d' });
    },
    decode: async ({ token, secret }) => {
      try {
        return jwt.verify(token as string, secret as string) as JWT;
      } catch {
        // jwt.verify는 실패 시 예외를 던지지만 NextAuth는 null 반환을 기대함
        return null;
      }
    },
  },
  pages: {},
  callbacks: {
    async jwt({ token, user }) {
      // 최초 로그인 시 user 객체가 존재 — DB에서 가져온 role을 토큰에 저장
      if (user) {
        token.role = (user as { role?: string }).role ?? 'USER';
      }
      return token;
    },
    session({ session, token }) {
      // JWT 전략에서는 token.sub에 userId가 담겨 있으므로 session.user.id에 복사
      if (token.sub) {
        session.user.id = token.sub;
      }
      if (token.role) {
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});
