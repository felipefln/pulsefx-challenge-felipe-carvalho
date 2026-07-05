# Pulse FX

MVP de acompanhamento do câmbio USD/BRL e de indicadores macroeconômicos relacionados, a partir de
fontes públicas (Banco Central do Brasil e FRED). Dashboard com cards, tela de detalhe com série
histórica (gráfico + tabela) e "Meus indicadores" (favoritos), tudo com dados sincronizados de
verdade — nada de mock no front.

> Conteúdo educacional. Não é recomendação de investimento.

## Sumário

- [Visão geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Tecnologias](#tecnologias)
- [Como rodar via Docker Compose](#como-rodar-via-docker-compose-recomendado)
- [Como rodar em modo desenvolvimento](#como-rodar-em-modo-desenvolvimento)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Endpoints da API](#endpoints-da-api)
- [Indicadores escolhidos](#indicadores-escolhidos)
- [Regra de variação percentual](#regra-de-variação-percentual)
- [Janela de histórico e limitações dos dados](#janela-de-histórico-e-limitações-dos-dados)
- [Sincronização](#sincronização)
- [Testes e lint](#testes-e-lint)
- [Decisões técnicas e trade-offs](#decisões-técnicas-e-trade-offs)

## Visão geral

- **Dashboard**: um card por indicador, com nome, último valor, data de referência da observação
  (não a data da consulta) e variação percentual.
- **Detalhe** (`/indicators/:code`): série temporal em gráfico + tabela, janela de histórico
  ajustada ao tipo de série, e um texto explicando as limitações daquele dado.
- **Meus indicadores**: favoritar/desfavoritar um indicador, persistido de verdade no backend e
  associado a um usuário anônimo (UUID gerado no navegador, sem cadastro/login).
- **Sincronização**: job agendado (cron) busca dados novos nas fontes externas periodicamente;
  também existe um endpoint administrativo protegido para disparar uma sincronização manual.
- **Disclaimer** visível em toda página: conteúdo educacional, não é recomendação de investimento.

## Arquitetura

Monorepo pnpm com 3 pacotes:

```
apps/api/       Express + TypeScript — API HTTP, sync, Prisma/Postgres
apps/web/       React + TypeScript (Vite) — dashboard, detalhe, favoritos
packages/shared/ Tipos, DTOs e regras de domínio compartilhados entre api e web
```

A API segue camadas no estilo Clean/Hexagonal (ports & adapters), com inversão de dependência:

```
domain/            regras de negócio e interfaces de repositório (não conhece Prisma)
infrastructure/    implementações concretas (Prisma, clientes HTTP BCB/FRED, scheduler)
application/       use cases — orquestram domain + infrastructure via as interfaces
interfaces/http/   rotas Express, middlewares — só chamam use cases já montados
composition.ts     composition root: único lugar que instancia classes concretas
```

Nenhuma rota instancia um repositório Prisma diretamente; tudo é injetado a partir de
`composition.ts`. Isso permite trocar a fonte de dados (ex.: outro banco) sem tocar em domínio ou
nas rotas.

## Tecnologias

**Backend (`apps/api`)**
- Node.js + TypeScript
- Express
- Prisma ORM (v6 — ver seção [Decisões técnicas e trade-offs](#decisões-técnicas-e-trade-offs) sobre por que não v7) + PostgreSQL
- node-cron (agendamento de sincronização)
- swagger-jsdoc + swagger-ui-express (documentação OpenAPI gerada a partir de comentários `@openapi`)
- Vitest + Supertest (testes unitários, de integração com Postgres real, e de rota HTTP)

**Frontend (`apps/web`)**
- React 19 + TypeScript (Vite)
- react-router-dom (roteamento client-side)
- @tanstack/react-query (cache, loading/error state, invalidação de queries)
- recharts (gráfico de série temporal)
- Vitest + @testing-library/react (testes de componente e hook)
- oxlint

**Compartilhado (`packages/shared`)**
- Tipos e DTOs (`Indicator`, `Observation`, `IndicatorSummary`, `IndicatorHistoryResponse`, ...)
- Regras de domínio puras: normalização de data e cálculo de variação percentual (usadas
  identicamente pela API — hoje o front só consome o resultado já calculado)

**Infraestrutura**
- Docker + Docker Compose (Postgres + API + Web)
- pnpm workspaces

## Como rodar via Docker Compose (recomendado)

Pré-requisitos: Docker e Docker Compose.

```bash
cp .env.example .env
# opcional: edite FRED_API_KEY (necessária só pro indicador Federal Funds Rate)
#           e ADMIN_SYNC_TOKEN (senha do endpoint de sync manual)

docker compose up -d --build
```

Isso sobe 3 containers: `postgres`, `api` (roda `prisma migrate deploy` automaticamente antes de
subir) e `web` (nginx servindo o build estático). Espere a API ficar saudável:

```bash
curl http://localhost:3333/health
# {"status":"ok","db":"ok"}
```

O banco começa vazio — os indicadores precisam ser criados (seed) e sincronizados uma primeira vez:

```bash
# cria os 3 indicadores (idempotente, pode rodar de novo sem duplicar)
docker compose exec api ./node_modules/.bin/tsx prisma/seed.ts

# dispara a primeira sincronização (busca dados reais no BCB/FRED)
curl -X POST http://localhost:3333/admin/sync \
  -H "X-Admin-Token: troque-por-um-valor-secreto"
```

Depois disso:

```bash
curl http://localhost:3333/indicators   # já deve vir com valor, data e variação
open http://localhost:5173              # dashboard no navegador
```

Documentação interativa da API (Swagger) em `http://localhost:3333/docs`.

Para derrubar tudo (mantendo os dados): `docker compose down`. Para apagar também o volume do
Postgres: `docker compose down -v`.

## Como rodar em modo desenvolvimento

Útil para iterar rápido em código sem rebuildar imagem Docker a cada mudança.

Pré-requisitos: Node.js ≥ 20, pnpm (`corepack enable` já resolve a versão certa via o campo
`packageManager` do `package.json` raiz), Docker (só para o Postgres).

```bash
pnpm install

# sobe só o Postgres em Docker (host: localhost:5433, não 5432 — evita conflito
# com um Postgres já instalado localmente)
cp .env.example .env
docker compose up -d postgres
```

### API (`apps/api`)

```bash
cd apps/api
cp .env.example .env   # DATABASE_URL já aponta pro Postgres do compose acima
pnpm prisma:migrate     # aplica as migrations (cria o schema)
pnpm prisma:seed        # popula os 3 indicadores
pnpm dev                # tsx watch — recompila a cada mudança
```

API sobe em `http://localhost:3333`. Dispare uma sincronização manual com o `POST /admin/sync` do
passo anterior para ter dados reais para testar.

### Web (`apps/web`)

```bash
cd apps/web
cp .env.example .env   # VITE_API_URL=http://localhost:3333
pnpm dev
```

Web sobe em `http://localhost:5173`.

### Atenção ao editar `packages/shared`

`packages/shared` é publicado como JS compilado (`dist/`), não como `.ts` fonte — necessário para
`node dist/index.js` funcionar em produção (tsx/Vite transpilam TS on-the-fly em dev, mas o Node
puro não). Depois de alterar algo em `packages/shared/src`, rode:

```bash
pnpm --filter @pulsefx/shared build
```

antes de testar a mudança em `apps/api` ou `apps/web` fora do modo watch.

## Variáveis de ambiente

Raiz (`.env`, usado pelo `docker-compose.yml`) — ver `.env.example` para os valores default:

| Variável | Uso |
|---|---|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | credenciais do Postgres |
| `POSTGRES_PORT` | porta exposta no host (5433 por padrão, para não colidir com um Postgres local) |
| `API_PORT` | porta exposta no host pra API (3333) |
| `FRED_API_KEY` | key da FRED ([fredaccount.stlouisfed.org/apikeys](https://fredaccount.stlouisfed.org/apikeys)) — sem ela, só o Federal Funds Rate falha ao sincronizar, os outros indicadores funcionam normalmente |
| `ADMIN_SYNC_TOKEN` | token exigido no header `X-Admin-Token` para `POST /admin/sync` |
| `CORS_ORIGINS` | origens autorizadas a chamar a API pelo navegador |
| `WEB_PORT` | porta exposta no host pro web (5173) |
| `VITE_API_URL` | URL da API que o **navegador** do usuário alcança — embutida no bundle em tempo de build, não runtime |

`apps/api/.env` e `apps/web/.env` (dev local, fora do Docker) seguem o mesmo padrão, ver os
respectivos `.env.example`.

## Endpoints da API

Documentação completa e interativa em `/docs` (Swagger UI) e `/openapi.json` (spec crua).

| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | Status da API + conectividade com o Postgres |
| GET | `/indicators` | Lista os indicadores (cards do dashboard) |
| GET | `/indicators/:code/history?window=` | Série temporal + metadados (tela de detalhe) |
| GET | `/favorites` | Lista os códigos favoritados pelo usuário anônimo atual |
| POST | `/favorites/:code` | Favorita um indicador (idempotente) |
| DELETE | `/favorites/:code` | Desfavorita um indicador (idempotente) |
| POST | `/admin/sync?code=` | Dispara sincronização manual (todos os indicadores, ou um específico) — exige `X-Admin-Token` |

`GET /indicators` e `GET /indicators/:code/history` aceitam o header opcional `X-Anonymous-Id`; as
rotas de `/favorites` o exigem (400 sem ele).

## Indicadores escolhidos

Duas fontes, um conjunto coerente: o câmbio em si, mais o contexto de inflação e juros que ajuda a
explicar por que ele se move.

| Código | Nome | Fonte | Frequência | Por quê |
|---|---|---|---|---|
| `usd-brl` | Dólar comercial (USD/BRL) | [BCB — PTAX](https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/swagger-config) | Diária | A cotação de fechamento mais usada no Brasil — a razão de existir do Pulse FX |
| `ipca` | IPCA (variação mensal) | [BCB — SGS, série 433](https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados) | Mensal | Inflação oficial do Brasil, referência do Banco Central para a Selic |
| `fed-funds-rate` | Federal Funds Rate (EUA) | [FRED — FEDFUNDS](https://fred.stlouisfed.org/series/FEDFUNDS) | Mensal | Diferencial de juros BR–EUA é um dos principais motores de fluxo de capital e câmbio |

## Regra de variação percentual

- **Série diária** (PTAX): compara o último fechamento com o fechamento de **D-1 dia com pregão**
  (não interpola fins de semana/feriados — usa o último dado válido já persistido).
- **Série mensal** (IPCA, Fed Funds): compara o último mês fechado com o **mês anterior** (MoM).
- Em ambos os casos, N=1 (compara sempre com a observação imediatamente anterior já persistida).
- A data exibida é sempre a **data de referência da observação**, nunca a data em que a consulta
  foi feita — evita a falsa impressão de "dado de hoje" quando na verdade é o último disponível.
- Sem histórico suficiente (só 1 observação persistida), a variação retorna `null` e o front mostra
  "sem histórico suficiente" em vez de 0% ou um traço enganoso.

Ver [ADR 0001](docs/adr/0001-regra-de-variacao-percentual.md) para a decisão completa.

## Janela de histórico e limitações dos dados

| Frequência | Janela default | Teto (`?window=`) |
|---|---|---|
| Diária | 30 observações (~1 mês de pregões) | 180 |
| Mensal | 24 observações (2 anos) | 60 |

A tela de detalhe também exibe um texto de limitações específico por tipo de série (ex.: "finais
de semana e feriados não têm cotação, não interpolamos" para diária; "pode haver defasagem entre o
mês de referência e a divulgação" para mensal) — conteúdo educacional, não recomendação de
investimento.

## Sincronização

- **Agendada**: diária às 14h BRT em dias úteis (após o fechamento PTAX, ~13h) e mensal no dia 1º
  às 15h — evita bater nas APIs externas fora de hora ou de forma redundante.
- **Manual**: `POST /admin/sync` (protegido por `X-Admin-Token`, fail-closed — sem o token
  configurado no ambiente, o endpoint fica bloqueado).
- **Idempotente**: reprocessar o mesmo período não duplica dados — depende de uma constraint única
  `(indicatorId, refDate)` no Postgres, não de lógica de aplicação.
- **Isolada por indicador**: uma falha ao sincronizar um indicador (ex.: FRED sem API key) não
  impede a sincronização dos demais.

Ver [ADR 0002](docs/adr/0002-sincronizacao-ttl-agendamento.md).

## Testes e lint

```bash
pnpm -r test     # roda os 3 pacotes (91 testes: 56 api + 24 web + 11 shared)
pnpm --filter web lint
pnpm --filter api exec tsc --noEmit -p tsconfig.json   # typecheck da api
pnpm --filter web build                                 # inclui tsc -b (typecheck do web)
```

Cobertura por camada:
- **Domínio** (`packages/shared`): cálculo de variação, normalização de data.
- **Repositórios** (`apps/api`): contra o Postgres real do `docker-compose.yml` — exercitam
  constraints únicas de verdade, não um mock de ORM.
- **Use cases**: com repositórios fake — regra de negócio isolada de infraestrutura.
- **Rotas HTTP**: via Supertest, com use cases mockados.
- **Integração** (`apps/api/src/integration`): sync → `GET /indicators` de ponta a ponta, com
  Postgres real e um provider externo falso (sem rede).
- **Frontend** (`apps/web`): componentes e hooks com @testing-library/react + jsdom.

## Decisões técnicas e trade-offs

- **Favoritos sem login**: usuário anônimo via UUID gerado no navegador (`localStorage`), enviado
  em `X-Anonymous-Id`. Cadastro/autenticação estavam fora do escopo do MVP. Ver
  [ADR 0003](docs/adr/0003-favoritos-anonimos.md).
- **Prisma v6, não v7**: v7 exige Node 22.12+; o ambiente de desenvolvimento usado tinha Node
  22.11. Pinado em `^6.19.3` em vez de forçar upgrade do Node.
- **Imagem Docker da API não é minimizada**: o estágio de build instala todas as dependências
  (incluindo devDependencies como o CLI do Prisma e `tsx`) e o runtime reaproveita esse
  `node_modules` inteiro, em vez de um segundo estágio de instalação só de produção. Prioriza
  simplicidade e corretude (o CLI do Prisma precisa estar disponível pro `migrate deploy` no
  entrypoint, e o `tsx` pro seed manual) dentro do prazo do desafio; um `pnpm deploy` com poda de
  dependências de produção deixaria a imagem menor, mas foi deliberadamente deixado de fora.
- **Seed não roda automático no entrypoint**: só a migration roda sozinha. Popular os indicadores
  e disparar a primeira sincronização são passos manuais documentados acima — consistente com como
  o projeto inteiro foi verificado a cada fase (curl explícito), em vez de mágica implícita no
  boot do container.
