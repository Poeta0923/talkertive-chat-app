'use client'

import Link from "next/link";
import { useState } from "react";
import { signUp } from "@/app/actions/auth-actions"

export default function SignUpPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (password !== passwordConfirm) {
            alert("비밀번호가 일치하지 않습니다.");
            return;
        }

        const result = await signUp({ name, email, password });

        if (result?.status === 'ok') {
            setIsSuccess(true);
        } else {
            alert(result?.message ?? "회원가입에 실패했습니다.");
        }
    }

    return (
        <div className="flex flex-col items-center justify-center h-screen gap-4 relative">
            <h1 className="text-3xl font-bold">회원가입</h1>
            <p className="text-gray-700">talkertive에서 다양한 만남의 기회를 얻으세요</p>

            <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-2 min-w-75"
            >
                <label htmlFor="name">이름</label>
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    type="text"
                    name="name"
                    placeholder="홍길동"
                    className="border-2 border-gray-400 rounded-sm p-2"
                />
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
                <label htmlFor="passwordConfirm">비밀번호 확인</label>
                <input
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    type="password"
                    name="passwordConfirm"
                    className="border-2 border-gray-400 rounded-sm p-2"
                />

                <button
                    type="submit"
                    className="bg-blue-500 text-white font-bold rounded-sm p-2 mt-2 hover:bg-green-600 cursor-pointer"
                >
                    회원가입
                </button>
                <Link href="/signin" className="text-center border-2 border-gray-400 rounded-sm p-2 hover:border-gray-600">로그인</Link>
            </form>

            {isSuccess && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="flex flex-col items-center gap-4 bg-white rounded-lg p-10 shadow-xl min-w-75">
                        <h2 className="text-2xl font-bold">회원가입 완료</h2>
                        <p className="text-gray-600">회원가입에 성공했습니다.</p>
                        <Link
                            href="/signin"
                            className="w-full text-center bg-blue-500 text-white font-bold rounded-sm p-2 hover:bg-blue-600"
                        >
                            로그인
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
