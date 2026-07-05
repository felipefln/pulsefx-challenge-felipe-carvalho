# syntax=docker/dockerfile:1

# Build context é a raiz do monorepo (necessário pro pnpm resolver o workspace):
#   docker build -f apps/api/Dockerfile .

FROM node:22-slim AS base
# Prisma precisa do OpenSSL pra detectar a engine binária certa; sem isso ele
# cai num fallback (openssl-1.1.x) que não existe nessa imagem e quebra o client.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /repo

# --- deps + build: precisa do código fonte e de todas as devDependencies (tsc, prisma CLI) ---
FROM base AS build
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile

COPY packages/shared packages/shared
COPY apps/api apps/api

RUN pnpm --filter @pulsefx/shared build
RUN pnpm --filter api exec prisma generate
RUN pnpm --filter api build

# --- runtime: só o necessário pra rodar a API já buildada ---
FROM base AS runtime
ENV NODE_ENV=production

COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/packages/shared/dist ./packages/shared/dist
COPY --from=build /repo/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=build /repo/packages/shared/package.json ./packages/shared/package.json
COPY --from=build /repo/apps/api/dist ./apps/api/dist
COPY --from=build /repo/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /repo/apps/api/package.json ./apps/api/package.json
COPY --from=build /repo/apps/api/prisma ./apps/api/prisma
COPY --from=build /repo/apps/api/src ./apps/api/src

WORKDIR /repo/apps/api
COPY apps/api/docker-entrypoint.sh /repo/apps/api/docker-entrypoint.sh
RUN chmod +x /repo/apps/api/docker-entrypoint.sh

EXPOSE 3333
ENTRYPOINT ["/repo/apps/api/docker-entrypoint.sh"]
CMD ["node", "dist/index.js"]
