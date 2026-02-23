FROM oven/bun:1.3.8 AS deps
WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/types/src ./packages/types/src
COPY packages/config ./packages/config

RUN bun install --frozen-lockfile

FROM deps AS builder
WORKDIR /app
COPY apps/web ./apps/web
RUN bun run --cwd apps/web build

FROM oven/bun:1.3.8 AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000

CMD ["bun", "apps/web/server.js"]
