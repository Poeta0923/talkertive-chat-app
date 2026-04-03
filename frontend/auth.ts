import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { comparePassword } from "./lib/password-utils";
import * as jwt from "jsonwebtoken";
import { JWT } from "next-auth/jwt";

export const { handlers, auth, signIn, signOut } = NextAuth({
  useSecureCookies: process.env.NODE_ENV === "production",
  trustHost: true,
  adapter: PrismaAdapter(prisma),
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
      async authorize(credentials) {
        if (!credentials || !credentials.email || !credentials.password) {
          throw new Error("이메일과 비밀번호를 입력해주세요.");
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email as string,
          },
        });

        if (!user) {
          throw new Error("존재하지 않는 이메일입니다.");
        }

        const passwordMatch = comparePassword(
          credentials.password as string,
          user.hashedPassword as string,
        );

        if (!passwordMatch) {
          throw new Error("비밀번호가 일치하지 않습니다.");
        }

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
      return jwt.sign(token as jwt.JwtPayload, secret as string);
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
  callbacks: {},
});
