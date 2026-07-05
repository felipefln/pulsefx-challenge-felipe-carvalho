import { calculateVariation, LOOKBACK_BY_FREQUENCY, type IndicatorSummary } from "@pulsefx/shared";
import type { FavoriteRepository } from "../../domain/repositories/favoriteRepository";
import type { IndicatorRepository } from "../../domain/repositories/indicatorRepository";
import type { ObservationRepository } from "../../domain/repositories/observationRepository";

/**
 * Monta os cards do dashboard: para cada indicador cadastrado, busca só o
 * histórico necessário para a regra de variação (LOOKBACK_BY_FREQUENCY + 1
 * observações), nunca a série inteira — GET /indicators não precisa da
 * história completa, só do último ponto e do de comparação.
 */
export class ListIndicatorsUseCase {
  constructor(
    private readonly indicatorRepository: IndicatorRepository,
    private readonly observationRepository: ObservationRepository,
    private readonly favoriteRepository: FavoriteRepository,
  ) {}

  async execute(anonymousUserId?: string): Promise<IndicatorSummary[]> {
    const indicators = await this.indicatorRepository.findAll();

    const favoriteIndicatorIds = anonymousUserId
      ? new Set(await this.favoriteRepository.findIndicatorIdsByAnonymousUserId(anonymousUserId))
      : new Set<string>();

    return Promise.all(
      indicators.map(async (indicator) => {
        const lookback = LOOKBACK_BY_FREQUENCY[indicator.frequency];
        const observations = await this.observationRepository.findByIndicatorId(indicator.id, {
          limit: lookback + 1,
        });

        return {
          code: indicator.code,
          name: indicator.name,
          description: indicator.description,
          unit: indicator.unit,
          frequency: indicator.frequency,
          source: indicator.source,
          latestObservation: observations.at(-1) ?? null,
          variation: calculateVariation(observations, indicator.frequency),
          isFavorite: favoriteIndicatorIds.has(indicator.id),
        };
      }),
    );
  }
}
