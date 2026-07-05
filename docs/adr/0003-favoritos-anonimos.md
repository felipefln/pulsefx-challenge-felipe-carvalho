# ADR 0003 — Favoritos sem autenticação (usuário anônimo)

## Contexto

"Meus indicadores" pede persistência real de favoritos por usuário, mas cadastro/login estava fora
do escopo do MVP (autenticação completa é um projeto à parte, com custo desproporcional ao prazo do
desafio). Ainda assim, o requisito era persistência de verdade no backend — não bastaria salvar só
no `localStorage` do navegador, sem sobreviver a limpar dados do site ou trocar de aparelho seria
uma limitação aceitável, mas sem persistência nenhuma no servidor não atenderia ao pedido.

## Decisão

- O frontend gera um UUID (`crypto.randomUUID()`) na primeira visita e guarda em `localStorage`
  (`apps/web/src/api/anonymousUser.ts`), sem nenhum dado pessoal envolvido.
- Esse UUID é enviado em toda requisição via o header `X-Anonymous-Id` (middleware
  `anonymousUser.ts` na API), e persistido de verdade no Postgres: `Favorite` tem
  `(anonymousUserId, indicatorId)` como chave única.
- Em `GET /indicators` o header é **opcional** — sem ele, a lista vem sem nenhum favorito marcado
  (`isFavorite: false` em todos), mas a rota funciona normalmente. Em `/favorites` o header é
  **obrigatório** (400 sem ele) — não existe "favoritar" sem alguém a favoritar.
- `POST`/`DELETE /favorites/:code` são idempotentes (upsert / deleteMany) — favoritar duas vezes ou
  desfavoritar algo que não estava favoritado não é erro, é a mesma operação repetida.

## Consequências

- Favoritos persistem entre sessões no mesmo navegador (mesmo `localStorage`), mas **não**
  atravessam dispositivos ou navegadores diferentes — o usuário não tem uma "conta" de verdade.
  Essa é uma limitação conhecida e aceita para o escopo do MVP.
- Se o usuário limpar o `localStorage`, o UUID se perde e os favoritos antigos ficam órfãos no
  banco (associados a um UUID que o navegador não tem mais) — aceitável para um MVP sem login;
  se o produto evoluir para autenticação de verdade, o caminho natural é migrar
  `anonymousUserId` para um `userId` real, sem mudar o formato da tabela `Favorite`.
