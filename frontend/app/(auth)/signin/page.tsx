'use client'

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";

export default function SignInPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // 기본값은 에러 페이지로 리다이렉트하므로, 직접 에러를 핸들링하기 위해 비활성화
        const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        if (result?.error) {
            alert("아이디 또는 비밀번호를 확인해주세요.");
            return;
        }

        window.location.href = '/';
    }

    return (
        <div className="flex flex-col items-center justify-center h-screen gap-4">
            <h1 className="text-3xl font-bold">로그인</h1>
            <p className="text-gray-700">talkertive 계정으로 로그인할 수 있습니다.</p>

            <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-2 min-w-[300px]"
            >
                <label htmlFor="email">이메일</label>
                <input 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email" 
                    name="email" 
                    placeholder="example@talkertive.com"
                    className="border-2 border-gray-400 rounded-sm p-2" 
                />
                <label htmlFor="password">비밀번호</label>
                <input 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password" 
                    name="password" 
                    className="border-2 border-gray-400 rounded-sm p-2" 
                />

                <button 
                    type="submit"
                    className="bg-blue-500 text-white font-bold rounded-sm p-2 mt-2 hover:bg-green-600 cursor-pointer"
                >
                    로그인
                </button>
                <Link href="/signup" className="text-center border-2 border-gray-400 rounded-sm p-2 hover:border-gray-600">회원가입</Link>

                <hr className="my-1 border-gray-300" />

                {/* Google OAuth — 클릭 시 Google 인증 페이지로 리다이렉트되고 콜백 후 자동 로그인 */}
                <button
                    type="button"
                    onClick={() => signIn('google', { callbackUrl: '/' })}
                    className="flex items-center justify-center gap-2 border-2 border-gray-400 rounded-sm p-2 hover:border-gray-600 cursor-pointer"
                >
                    <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google로 로그인
                </button>
            </form>
        </div>
    )
}