'use client'

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { signInWithCredentials } from "@/app/actions/auth-actions";

export default function SignInPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const result = await signInWithCredentials({ email, password });

        if (result.error) {
            alert(result.error);
            return;
        }

        router.push('/');
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
                    <FcGoogle size={18} />
                    Google로 로그인
                </button>
            </form>
        </div>
    )
}