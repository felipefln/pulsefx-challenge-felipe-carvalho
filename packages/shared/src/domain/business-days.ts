/**
 * Normaliza uma data para "YYYY-MM-DD" usando os componentes UTC, para que a
 * mesma data não vire dias diferentes dependendo do fuso horário de quem lê.
 * Fontes upstream (BCB, FRED) usam formatos diferentes; o parsing específico
 * de cada uma acontece na camada de infraestrutura, não aqui.
 */
export function normalizeToISODate(input: Date | string): string {
  const date = typeof input === "string" ? new Date(input) : input;
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isWeekend(input: Date | string): boolean {
  const date = typeof input === "string" ? new Date(input) : input;
  const dayOfWeek = date.getUTCDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
}

/**
 * Considera dia útil apenas "não é fim de semana". Feriados não entram nessa
 * checagem: como só persistimos observações nos dias em que a fonte publicou
 * dado, feriados já aparecem como lacunas naturais na série — ver seção de
 * calendário no README.
 */
export function isBusinessDay(input: Date | string): boolean {
  return !isWeekend(input);
}
