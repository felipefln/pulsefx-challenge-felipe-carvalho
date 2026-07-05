/** Formata o valor conforme a unidade do indicador — BRL com 4 casas (padrão PTAX), % com 2. */
export function formatValue(value: number, unit: string | null): string {
  if (unit === "BRL") {
    return `R$ ${value.toFixed(4)}`;
  }
  if (unit === "%") {
    return `${value.toFixed(2)}%`;
  }
  return value.toString();
}

/** refDate vem como "YYYY-MM-DD"; força meia-noite UTC pra não virar o dia anterior no fuso local. */
export function formatRefDate(refDate: string): string {
  return new Date(`${refDate}T00:00:00Z`).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}
