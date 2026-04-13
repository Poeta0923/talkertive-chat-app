'use server'

import { saltAndHashPassword } from "@/lib/password-utils";
import { prisma } from "@/prisma";

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
                hashedPassword: saltAndHashPassword(password),
            },
        });

        if (user) {
            return { status: 'ok' };
        }
    } catch (err) {
        return { status: 'error',message: "회원가입에 실패했습니다." };
    }
}