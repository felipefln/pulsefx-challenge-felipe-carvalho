import type { IndicatorFrequency, IndicatorSource, Observation, VariationResult } from "./types";

/**
 * Um item da lista de `GET /indicators` (o card do dashboard). `latestObservation`
 * e `variation` são `null` quando o indicador ainda não foi sincronizado ou não
 * tem histórico suficiente — nunca inventamos um valor que não existe.
 */
export interface IndicatorSummary {
  code: string;
  name: string;
  description: string;
  unit: string | null;
  frequency: IndicatorFrequency;
  source: IndicatorSource;
  latestObservation: Observation | null;
  variation: VariationResult | null;
  isFavorite: boolean;
}

/** Resposta de `GET /indicators/:code/history` — série temporal + metadados da tela de detalhe. */
export interface IndicatorHistoryResponse {
  code: string;
  name: string;
  description: string;
  unit: string | null;
  frequency: IndicatorFrequency;
  source: IndicatorSource;
  /** Texto sobre limitações dos dados exigido no MVP (calendário, defasagem de publicação etc.). */
  limitationsNote: string;
  observations: Observation[];
}
