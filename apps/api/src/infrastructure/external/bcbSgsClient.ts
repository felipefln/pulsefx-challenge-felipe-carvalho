import { normalizeToISODate } from "@pulsefx/shared";

const BASE_URL = "https://api.bcb.gov.br/dados/serie/bcdata.sgs";

/** Um par (data de referência, valor) já normalizado, pronto para persistir como Observation. */
export interface SgsObservation {
  refDate: string;
  value: number;
}

interface SgsApiItem {
  data: string;
  valor: string;
}

/** Formata uma Date como DD/MM/YYYY, o formato exigido pela API do SGS. */
function toBrDate(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

/** Converte "DD/MM/YYYY" (formato do SGS) para uma Date UTC à meia-noite. */
function parseBrDate(value: string): Date {
  const [day, month, year] = value.split("/").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Busca observações de uma série do SGS (Sistema Gerenciador de Séries
 * Temporais do BCB) num intervalo de datas. Genérico por design: serve tanto
 * para o IPCA (série 433, variação mensal já em %) quanto para qualquer
 * outra série SGS que o Pulse FX venha a expor no futuro — só muda o código.
 */
export async function fetchSgsSeries(
  seriesCode: number,
  startDate: Date,
  endDate: Date,
): Promise<SgsObservation[]> {
  const url =
    `${BASE_URL}.${seriesCode}/dados?formato=json` +
    `&dataInicial=${toBrDate(startDate)}&dataFinal=${toBrDate(endDate)}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`BCB SGS (série ${seriesCode}) respondeu ${response.status} para o intervalo solicitado`);
  }

  const body = (await response.json()) as SgsApiItem[];

  return body.map((item) => ({
    refDate: normalizeToISODate(parseBrDate(item.data)),
    value: Number(item.valor),
  }));
}
