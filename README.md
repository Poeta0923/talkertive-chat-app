# Talkertive

> 관심사 기반 모임을 만들고, 실시간으로 소통하는 채팅·모임 플랫폼

---

## 📌 프로젝트 한 줄 요약

관심사가 같은 사람들이 모임을 개설하고, **실시간 채팅·일정 관리·AI 자연어 입력**으로 소통할 수 있는 풀스택 웹 애플리케이션

---

## 🖼️ 스크린샷

| 홈 화면 | 채팅 화면 |
|:---:|:---:|
| ![home](docs/images/home.png) | ![chat](docs/images/chat.png) |

| 모임 상세 | 관리자 대시보드 |
|:---:|:---:|
| ![room-detail](docs/images/room-detail.png) | ![admin](docs/images/admin-dashboard.png) |

---

## ✨ 주요 기능

### 인증
- 이메일/비밀번호 로그인 및 **Google OAuth** 소셜 로그인
- NextAuth v5와 NestJS Passport JWT가 동일한 `AUTH_SECRET`으로 토큰을 공유하는 통합 인증 구조
- 로그인 시도 횟수 제한 (5회/15분, IP 기반 Rate Limiting)

### 모임 (Group Room)
- 스터디, 스포츠, 음식, 여행 등 **8가지 카테고리**의 모임 개설 및 탐색
- 커버 이미지, 제목, 한줄 소개, 날짜/장소, 인원 제한 등 상세 설정
- 좋아요, 멤버 초대, OWNER 권한 양도, 멤버 관리

### 실시간 채팅 (WebSocket)
- **Socket.io** 기반 실시간 메시지 송수신
- 메시지 수정/삭제(소프트 딜리트), 읽음 처리, 타이핑 인디케이터
- 파일·이미지 첨부 (AWS S3 업로드)
- 1:1 다이렉트 채팅 및 그룹 채팅 모두 지원

### AI 일정 관리
- **Claude API (claude-sonnet)** 를 활용한 자연어 일정 생성·수정·삭제
- "다음 주 토요일 오후 2시에 스터디 모임 추가해줘" 같은 입력으로 일정 자동 등록

### 관리자 대시보드
- 회원/모임 통계 (총계, 30일 추이 차트, 카테고리별 분포)
- 회원·모임 목록 조회, 검색/필터, 강제 삭제
- 홈 배너 등록·삭제

---

## 🛠️ 기술 스택

### Frontend
| 분류 | 기술 |
|---|---|
| Framework | Next.js 15 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Auth | NextAuth v5 (Credentials + Google OAuth) |
| Realtime | Socket.io-client |
| State | TanStack Query 5, Jotai |
| UI | Tailwind CSS 4, shadcn/ui, Radix UI |
| API Client | @hey-api/openapi-ts (OpenAPI 자동 생성) |

### Backend
| 분류 | 기술 |
|---|---|
| Framework | NestJS 11 |
| Language | TypeScript 5 |
| Database | PostgreSQL + Prisma ORM |
| Auth | Passport JWT (검증 전용, 토큰은 프론트와 공유) |
| Realtime | Socket.io (WebSocket Gateway) |
| Cache | Redis (cache-manager + Keyv) |
| Storage | AWS S3 (이미지/파일 업로드) |
| AI | Claude API (@anthropic-ai/sdk) |
| Monitoring | Sentry, Winston 로깅 |
| Docs | Swagger / OpenAPI |

### Infrastructure
| 분류 | 기술 |
|---|---|
| Container | Docker, Docker Compose |
| CI/CD | GitHub Actions |

---

## 🏗️ 아키텍처

```mermaid
graph TD
    Client["Client (Browser)\nNext.js 15 App Router · Socket.io-client · TanStack Query"]

    Client -->|HTTPS / WSS| NextAuth
    Client -->|HTTPS / WSS| NestJS

    NextAuth["NextAuth v5\n(JWT 발급)\n/api/auth/*"]
    NestJS["NestJS API\n(JWT 검증)\n:8000\nREST + WS(/chat)"]

    NextAuth <-->|shared AUTH_SECRET| NestJS

    NestJS --> PostgreSQL["PostgreSQL\n(Prisma)"]
    NestJS --> Redis["Redis\n(캐시)"]
    NestJS --> S3["AWS S3\n(이미지/파일)"]
```

### 인증 흐름
1. 프론트엔드에서 NextAuth가 JWT를 발급하고 쿠키(`authjs.session-token`)에 저장
2. API 요청 시 쿠키에서 토큰을 꺼내 `Authorization: Bearer` 헤더로 전달
3. NestJS의 Passport JWT 전략이 동일한 `AUTH_SECRET`으로 토큰을 검증
4. WebSocket 연결 시에도 handshake 시점에 `WsJwtGuard`가 토큰을 검증

---

## 📁 프로젝트 구조

```
talkertive-chat-app/
├── frontend/                  # Next.js 15 앱 (포트 3000)
│   ├── app/
│   │   ├── (auth)/            # 로그인·회원가입 라우트
│   │   ├── (main)/            # 메인 레이아웃 (Header 포함)
│   │   │   ├── page.tsx       # 홈 (배너 + 모임 목록)
│   │   │   ├── chat/[roomId]/ # 실시간 채팅
│   │   │   ├── rooms/         # 모임 생성·상세
│   │   │   └── mypage/        # 프로필·내 모임
│   │   └── (admin)/           # 관리자 패널
│   ├── components/            # 공유 컴포넌트
│   ├── hooks/                 # 커스텀 React 훅
│   ├── generated/openapi-client/ # 자동 생성 API 클라이언트
│   └── prisma/                # 스키마 + 마이그레이션
│
└── backend/                   # NestJS API (포트 8000)
    └── src/
        ├── auth/              # Passport JWT 전략·가드
        ├── rooms/             # 모임 REST API
        ├── room-members/      # 멤버 관리 API
        ├── chat/              # WebSocket 채팅 게이트웨이
        ├── schedules/         # 일정 관리 + AI 처리
        ├── admin/             # 관리자 통계·관리 API
        ├── media/             # S3 파일 업로드
        ├── users/             # 유저 프로필 API
        └── health/            # 헬스체크 (DB + Redis)
```

---

## 🗄️ 도메인 모델

```
User ──── Account (OAuth)
  │
  ├── RoomMember ──── Room (DIRECT / GROUP)
  │                     │
  │                     ├── Message ──── MessageAttachment
  │                     │     └── MessageRead
  │                     ├── RoomLike
  │                     └── RoomSchedule
  │
  └── Banner (ADMIN only)
```

- `Room`: `DIRECT`(1:1) / `GROUP`(모임)을 단일 테이블로 관리
- `RoomMember`: `leftAt` null이면 현재 참여 중 (소프트 딜리트)
- `Message`: `deletedAt`으로 소프트 딜리트

---

## ⚡ WebSocket 이벤트

| 클라이언트 → 서버 | 서버 → 클라이언트 | 설명 |
|---|---|---|
| `join-room { roomId }` | `room-joined { messages }` | 입장 + 최근 메시지 50개 |
| `send-message { roomId, content }` | `new-message` | 메시지 전송 (브로드캐스트) |
| `edit-message { messageId, content }` | `message-edited` | 메시지 수정 |
| `delete-message { messageId }` | `message-deleted` | 메시지 삭제 |
| `read-message { roomId, lastMessageId }` | `message-read` | 읽음 처리 |
| `typing { roomId, isTyping }` | `user-typing` | 타이핑 인디케이터 |

---

## 🚨 트러블슈팅 및 설계 고민

### 1) NextAuth ↔ NestJS 토큰 공유

- **문제**: NextAuth가 발급한 JWT를 NestJS에서 그대로 쓰려면 토큰 형식이 동일해야 하는데, NextAuth의 기본 인코딩 방식이 NestJS의 Passport-JWT와 맞지 않음
- **해결**: NextAuth의 `encode` / `decode`를 `jsonwebtoken`으로 직접 오버라이드해 HS256 방식을 통일하고, `AUTH_SECRET`을 양쪽이 공유. 별도 토큰 발급 엔드포인트 없이 인증 단일화

### 2) WebSocket 인증

- **문제**: HTTP Passport 미들웨어는 WebSocket handshake에 자동 적용되지 않아 채팅 연결이 인증 없이 가능한 상태
- **해결**: `WsJwtGuard`를 직접 구현해 handshake 시점에 토큰을 검증하고 `socket.data.user`에 payload를 주입. HTTP/WS 모두 동일한 인증 흐름으로 통일

### 3) AI 일정 처리의 모호성

- **문제**: "다음 주 토요일"처럼 상대적 날짜 표현을 Claude API에 그대로 전달하면 기준 시점이 불분명해 잘못된 날짜를 생성
- **해결**: 시스템 프롬프트에 현재 날짜·시간·요일을 명시적으로 포함. structured output으로 `create / update / cancel` 액션을 반환받아 Prisma로 처리

### 4) 프론트엔드 타입 동기화

- **문제**: 백엔드 API가 변경될 때마다 프론트엔드 fetch 코드와 타입을 수동으로 맞춰야 하는 비용
- **해결**: `@hey-api/openapi-ts`로 백엔드 Swagger 스펙에서 타입 안전한 API 클라이언트를 자동 생성. `npx openapi-ts` 한 번으로 프론트엔드 타입 전체 동기화

---

## 🧠 설계 의도

- **단일 `Room` 테이블**로 DIRECT/GROUP 두 타입을 관리해 관계 복잡도를 줄이고, 내 채팅방 목록 조회를 단일 쿼리로 처리
- **소프트 딜리트** 방식으로 메시지·멤버를 관리해 히스토리 보존과 읽음 처리 정합성을 동시에 확보
- **OpenAPI 자동 생성 클라이언트**로 백엔드·프론트엔드 타입을 스키마 기준으로 단일 관리

---

## 🎯 이 프로젝트로 보여주고 싶은 역량

- Next.js App Router와 NestJS를 실제로 연결하는 **풀스택 설계** 능력
- HTTP와 WebSocket 모두 동일한 JWT 인증 흐름으로 처리하는 **인증 설계** 이해
- AI API를 기능에 자연스럽게 녹여내는 **실용적 AI 통합** 경험
- 기능 단위가 아닌 도메인 기준으로 DB와 API를 설계하는 **도메인 모델링** 사고

---

## 🚀 로컬 실행

### 사전 요구사항
- Node.js 20+, pnpm, Docker

### 백엔드

```bash
cd backend
cp .env.example .env       # 환경변수 설정
docker compose up -d        # PostgreSQL 컨테이너 시작
pnpm install
npx prisma migrate dev
pnpm start:dev              # http://localhost:8000 · Swagger: /docs
```

### 프론트엔드

```bash
cd frontend
cp .env.local.example .env.local   # 환경변수 설정
pnpm install
pnpm dev                            # http://localhost:3000
```

---

## 🔑 환경변수

### Backend (`backend/.env`)

```env
DATABASE_URL=postgresql://user:password@localhost:5432/talkertive
AUTH_SECRET=your-secret-key        # NextAuth와 반드시 동일

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_S3_BUCKET=

POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=talkertive
```

### Frontend (`frontend/.env.local`)

```env
AUTH_SECRET=your-secret-key        # 백엔드와 동일한 값
NEXT_PUBLIC_API_URL=http://localhost:8000
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
```

---

## 📄 라이선스

MIT
