# ADR 0001 — Regra de variação percentual

## Contexto

O dashboard precisa mostrar, para cada indicador, quanto ele variou desde a última observação
comparável. Séries diárias (câmbio) e mensais (IPCA, Fed Funds) têm calendários e expectativas de
comparação diferentes, e feriados/fins de semana quebram qualquer suposição de "todo dia tem dado".

## Decisão

- **Diária** (PTAX): compara o último fechamento com o fechamento de **D-1 dia com pregão** (N=1).
  Nunca interpola — se não houve pregão em D-1 (feriado/fim de semana), a comparação é feita contra
  o último dado válido já persistido, não com um valor inventado.
- **Mensal** (IPCA, Fed Funds): compara o último mês fechado com o **mês anterior** (MoM, N=1).
- Ambos os casos usam a mesma implementação genérica (`calculateVariation` em
  `packages/shared/src/domain/variation.ts`), parametrizada só pelo "lookback" (hoje sempre 1) por
  frequência — evita duplicar a lógica de cálculo em dois lugares.
- Sem observações suficientes (só 1 ponto persistido), a variação retorna `null`, e o front exibe
  "sem histórico suficiente" em vez de 0% (que sugeriria falsamente "não mudou") ou um traço vazio.
- Se o valor anterior for exatamente 0 (caso raro em séries de juros perto de zero), a variação
  também retorna `null` em vez de `Infinity`/`NaN` — divisão por zero indefinida não vira "0%".
- A data exibida nos cards/detalhe é sempre a **data de referência da observação** (`refDate`),
  nunca a data em que a consulta HTTP foi feita — evita a impressão de "isso é o valor de hoje"
  quando na verdade é o último dado disponível (ex.: numa sexta à noite, o card de IPCA mostra a
  data do último mês fechado, não a data de hoje).

## Consequências

- A mesma regra vale em `GET /indicators` (card) e implicitamente em `GET /indicators/:code/history`
  (a série completa que alimenta o gráfico) — sem regra duplicada ou divergente entre as duas rotas.
- Fica simples adicionar uma quarta série trimestral/anual no futuro: só declarar o lookback certo,
  a lógica de comparação não muda.
