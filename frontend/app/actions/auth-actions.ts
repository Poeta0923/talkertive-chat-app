'use server'

import { signIn, signOut } from "@/auth";
import { saltAndHashPassword } from "@/lib/password-utils";
import { prisma } from "@/prisma";

export async function logout() {
  await signOut({ redirectTo: '/' });
}

export async function signInWithCredentials({ email, password }: { email: string; password: string }) {
  try {
    // 서버 액션에서 호출하는 signIn은 내부적으로 skipCSRFCheck를 사용하므로 MissingCSRF가 발생하지 않음
    const url = (await signIn('credentials', {
      email,
      password,
      redirect: false,
      redirectTo: '/',
    })) as string | undefined;

    if (url && url.includes('error=')) {
      return { error: '아이디 또는 비밀번호를 확인해주세요.' };
    }
    return {};
  } catch {
    return { error: '로그인 중 오류가 발생했습니다.' };
  }
}

export async function signUp({
    email,
    password,
    name,
}: {
    email: string;
    password: string;
    name: string;
}) {
    try{
        if (password.length < 8) {
            return { status: 'error', message: '비밀번호는 8자 이상이어야 합니다.' };
        }

        if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
            return { status: 'error', message: '비밀번호는 영문과 숫자를 모두 포함해야 합니다.' };
        }

        const existingUser = await prisma.user.findUnique({
            where: {
                email,
            }
        })

        if (existingUser) {
            return { status: 'error', message: "이미 존재하는 이메일입니다." };
        }

        const user = await prisma.user.create({
            data : {
                email,
                name,
                hashedPassword: await saltAndHashPassword(password),
            },
        });

        if (user) {
            return { status: 'ok' };
        }
    } catch (err) {
        return { status: 'error',message: "회원가입에 실패했습니다." };
    }
}