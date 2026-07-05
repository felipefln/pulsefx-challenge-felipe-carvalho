# ADR 0002 — Política de sincronização (agendamento, TTL e sync manual)

## Contexto

Os dados vêm de APIs públicas de terceiros (BCB, FRED) sem SLA garantido para o MVP. É preciso
manter os indicadores razoavelmente atualizados sem golpear essas APIs com chamadas redundantes ou
descontroladas — e sem duplicar dados se uma sincronização for repetida (intencionalmente ou por
retry).

## Decisão

- **Agendamento por tipo de série** (`node-cron`, em `apps/api/src/infrastructure/scheduler`):
  - Diária (PTAX): uma vez por dia útil, às 14h BRT — depois do fechamento PTAX (~13h), evitando
    buscar um dado que ainda não existe.
  - Mensal (IPCA, Fed Funds): uma vez por mês, dia 1º às 15h.
  - Frequências diferentes têm agendamentos diferentes de propósito: não faz sentido sincronizar
    uma série mensal todo dia.
- **`SyncStateRepository`** guarda, por indicador, a data da última sincronização e o último
  `refDate` conhecido. O `SyncIndicatorUseCase` usa esse estado para buscar só o intervalo novo
  (do último `refDate` em diante) em vez de rebaixar a série inteira a cada execução — sem
  sincronização prévia, usa uma janela de backfill inicial (30 dias corridos para diária, ~24
  meses para mensal).
- **Idempotência via constraint do banco, não lógica de aplicação**: `Observation` tem
  `@@unique([indicatorId, refDate])`, e `saveMany` usa `createMany({ skipDuplicates: true })`.
  Reprocessar o mesmo dia/mês (por retry, por reexecução manual, ou porque o `SyncStateRepository`
  ainda não tinha avançado) nunca duplica linha.
- **Isolamento por indicador**: `runScheduledSync` itera os indicadores de uma frequência e
  captura erro por item — uma fonte fora do ar (ex.: FRED sem API key) não impede a sincronização
  dos outros dois.
- **Endpoint administrativo `POST /admin/sync`** (`?code=` opcional) para forçar uma sincronização
  fora do horário agendado — protegido por `X-Admin-Token` (fail-closed: sem o token configurado no
  ambiente, o endpoint fica bloqueado por padrão, não aberto).

## Consequências

- Não existe um "botão mágico" de refresh automático a cada request do usuário — o dashboard lê
  sempre o que já está persistido, o que mantém a latência de leitura previsível e independente da
  disponibilidade do BCB/FRED no momento da visita.
- Um usuário que acabou de rodar `docker compose up` pela primeira vez precisa disparar
  `POST /admin/sync` manualmente uma vez (documentado no README) — decisão deliberada de manter o
  entrypoint do container simples e a sincronização como uma ação explícita, não implícita.
