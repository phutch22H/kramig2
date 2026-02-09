FROM node:20-alpine AS base

# ------- deps -------
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/admin/package.json ./apps/admin/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY packages/api-client/package.json ./packages/api-client/package.json
COPY packages/tsconfig/package.json ./packages/tsconfig/package.json

RUN corepack enable pnpm && pnpm install --frozen-lockfile

# ------- build -------
FROM base AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/admin/node_modules ./apps/admin/node_modules
COPY --from=deps /app/packages/ui/node_modules ./packages/ui/node_modules
COPY --from=deps /app/packages/api-client/node_modules ./packages/api-client/node_modules

COPY packages/tsconfig ./packages/tsconfig
COPY packages/ui ./packages/ui
COPY packages/api-client ./packages/api-client
COPY apps/admin ./apps/admin

WORKDIR /app/apps/admin
RUN corepack enable pnpm && pnpm build

# ------- production -------
FROM base AS production
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=build /app/apps/admin/public ./public
COPY --from=build --chown=nextjs:nodejs /app/apps/admin/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/apps/admin/.next/static ./apps/admin/.next/static

USER nextjs

EXPOSE 3001
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/admin/server.js"]
