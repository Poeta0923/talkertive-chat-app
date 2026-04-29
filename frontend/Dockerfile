FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm i -g pnpm && pnpm install --frozen-lockfile
COPY . .
# NEXT_PUBLIC_* 변수는 빌드 타임에 JS 번들에 포함되므로 런타임 env 주입이 불가능하다
# ECS 빌드 시 --build-arg NEXT_PUBLIC_API_URL=https://api.example.com 으로 전달해야 한다
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN npm i -g pnpm
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
