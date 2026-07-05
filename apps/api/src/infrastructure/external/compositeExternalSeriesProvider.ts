import type { Indicator } from "@pulsefx/shared";
import type { ExternalObservation, ExternalSeriesProvider } from "../../domain/services/externalSeriesProvider";
import { fetchPtaxRange } from "./bcbPtaxClient";
import { fetchSgsSeries } from "./bcbSgsClient";
import { fetchFredSeries } from "./fredClient";

/**
 * Valor sentinela usado em `Indicator.sourceSeriesId` para indicar "este
 * indicador BCB vem do PTAX (Olinda), não do SGS". Existe porque `source`
 * só distingue BCB de FRED — dentro de BCB ainda há duas APIs diferentes
 * (PTAX e SGS), e não valia a pena uma migration só pra mais um enum de
 * dois valores. Usado também pelo seed ao cadastrar o indicador de câmbio.
 */
export const BCB_PTAX_SENTINEL = "PTAX";

/**
 * Implementação de ExternalSeriesProvider que resolve qual dos 3 clientes
 * (BCB PTAX, BCB SGS, FRED) chamar a partir de `indicator.source` e
 * `indicator.sourceSeriesId`.
 */
export class CompositeExternalSeriesProvider implements ExternalSeriesProvider {
  async fetch(indicator: Indicator, startDate: Date, endDate: Date): Promise<ExternalObservation[]> {
    if (indicator.source === "FRED") {
      return fetchFredSeries(indicator.sourceSeriesId, startDate, endDate);
    }

    if (indicator.sourceSeriesId === BCB_PTAX_SENTINEL) {
      return fetchPtaxRange(startDate, endDate);
    }

    const seriesCode = Number(indicator.sourceSeriesId);
    if (Number.isNaN(seriesCode)) {
      throw new Error(
        `sourceSeriesId inválido para indicador BCB/SGS: "${indicator.sourceSeriesId}" (esperado "${BCB_PTAX_SENTINEL}" ou um código numérico de série)`,
      );
    }
    return fetchSgsSeries(seriesCode, startDate, endDate);
  }
}
