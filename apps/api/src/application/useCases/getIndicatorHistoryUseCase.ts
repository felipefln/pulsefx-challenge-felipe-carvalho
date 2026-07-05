import type { IndicatorFrequency, IndicatorHistoryResponse } from "@pulsefx/shared";
import type { IndicatorRepository } from "../../domain/repositories/indicatorRepository";
import type { ObservationRepository } from "../../domain/repositories/observationRepository";

/** Janela padrão de histórico por tipo de série, quando o cliente não pede uma janela específica. */
const DEFAULT_WINDOW: Record<IndicatorFrequency, number> = {
  DAILY: 30, // ~1 mês de pregões
  MONTHLY: 24, // 2 anos
};

/** Teto de janela por tipo de série — evita que um `?window=` gigante force uma varredura desnecessária. */
const MAX_WINDOW: Record<IndicatorFrequency, number> = {
  DAILY: 180,
  MONTHLY: 60,
};

/** Texto sobre limitações dos dados exigido no MVP, específico por tipo de série (ver README). */
const LIMITATIONS_NOTE: Record<IndicatorFrequency, string> = {
  DAILY:
    "Dado diário publicado pelo Banco Central (PTAX). Finais de semana e feriados não têm cotação — " +
    "não interpolamos, o gráfico reflete só os dias em que houve pregão. Conteúdo educacional; não é " +
    "recomendação de investimento.",
  MONTHLY:
    "Dado mensal publicado pela fonte oficial (BCB/FRED). Pode haver defasagem entre o fim do mês de " +
    "referência e a divulgação, e revisões pontuais da fonte não são retroagidas automaticamente aqui. " +
    "Conteúdo educacional; não é recomendação de investimento.",
};

/**
 * Monta a tela de detalhe: série temporal com janela por tipo (dias úteis
 * para diária, meses para mensal) e o texto de limitações exigido no MVP.
 * Retorna null quando o `code` não existe — a rota decide o 404.
 */
export class GetIndicatorHistoryUseCase {
  constructor(
    private readonly indicatorRepository: IndicatorRepository,
    private readonly observationRepository: ObservationRepository,
  ) {}

  async execute(code: string, requestedWindow?: number): Promise<IndicatorHistoryResponse | null> {
    const indicator = await this.indicatorRepository.findByCode(code);
    if (!indicator) {
      return null;
    }

    const window = this.resolveWindow(indicator.frequency, requestedWindow);
    const observations = await this.observationRepository.findByIndicatorId(indicator.id, { limit: window });

    return {
      code: indicator.code,
      name: indicator.name,
      description: indicator.description,
      unit: indicator.unit,
      frequency: indicator.frequency,
      source: indicator.source,
      limitationsNote: LIMITATIONS_NOTE[indicator.frequency],
      observations,
    };
  }

  private resolveWindow(frequency: IndicatorFrequency, requestedWindow?: number): number {
    if (!requestedWindow) {
      return DEFAULT_WINDOW[frequency];
    }
    return Math.min(requestedWindow, MAX_WINDOW[frequency]);
  }
}
