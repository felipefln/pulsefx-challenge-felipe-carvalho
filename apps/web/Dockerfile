# syntax=docker/dockerfile:1

# Build context é a raiz do monorepo (necessário pro pnpm resolver o workspace):
#   docker build -f apps/web/Dockerfile .

FROM node:22-slim AS base
# `pnpm install` na raiz do workspace também instala as deps da api (Prisma
# incluso) mesmo que este Dockerfile não use nada disso — evita warnings de
# libssl não encontrado durante o postinstall do @prisma/client.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile

COPY packages/shared packages/shared
COPY apps/web apps/web

# Vite embute VITE_* no bundle em tempo de build — precisa ser a URL que o
# NAVEGADOR do usuário alcança (ex.: http://localhost:3333), não o nome do
# serviço na rede interna do compose.
ARG VITE_API_URL=http://localhost:3333
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm --filter @pulsefx/shared build
RUN pnpm --filter web build

FROM nginx:1.27-alpine AS runtime
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
