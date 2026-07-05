import type { Indicator } from "@pulsefx/shared";

/** Um par (data de referência, valor) ainda sem indicatorId — o formato comum aos 3 clientes externos. */
export interface ExternalObservation {
  refDate: string;
  value: number;
}

/**
 * Porta que abstrai "de onde vem o dado" (BCB PTAX, BCB SGS ou FRED) atrás de
 * uma única operação. O SyncIndicatorUseCase depende só disso — não conhece
 * BCB nem FRED diretamente, só sabe que existe um provider que resolve um
 * Indicator para uma lista de observações num intervalo de datas.
 */
export interface ExternalSeriesProvider {
  fetch(indicator: Indicator, startDate: Date, endDate: Date): Promise<ExternalObservation[]>;
}
