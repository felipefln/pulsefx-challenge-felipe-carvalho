import type { IndicatorFrequency, Observation, VariationResult } from "../types";

/**
 * Quantas observações anteriores (já persistidas) entram na conta de variação,
 * por tipo de série. Ambas hoje comparam com N=1 observação anterior — para
 * diária isso é "D-1 dia útil com dado disponível" (o padrão que qualquer app
 * de câmbio mostra); para mensal é MoM (mês contra mês anterior). Documentado
 * também no README, seção de regra de variação.
 */
export const LOOKBACK_BY_FREQUENCY: Record<IndicatorFrequency, number> = {
  DAILY: 1,
  MONTHLY: 1,
};

/**
 * Calcula a variação percentual entre a observação mais recente e a N-ésima
 * anterior (N definido por LOOKBACK_BY_FREQUENCY). `observationsAsc` deve vir
 * ordenado por refDate crescente e já filtrado para um único indicador.
 *
 * Retorna null quando não há histórico suficiente, ou quando o valor anterior
 * é zero (divisão por zero indefinida — caso raro, mas possível em séries de
 * juros que já passaram perto de 0, ex.: FEDFUNDS em 2020-2021).
 */
export function calculateVariation(
  observationsAsc: Observation[],
  frequency: IndicatorFrequency,
): VariationResult | null {
  const lookback = LOOKBACK_BY_FREQUENCY[frequency];
  if (observationsAsc.length < lookback + 1) {
    return null;
  }

  const current = observationsAsc[observationsAsc.length - 1];
  const previous = observationsAsc[observationsAsc.length - 1 - lookback];

  if (previous.value === 0) {
    return {
      currentValue: current.value,
      currentRefDate: current.refDate,
      previousValue: previous.value,
      previousRefDate: previous.refDate,
      changePercent: null,
    };
  }

  const changePercent = ((current.value - previous.value) / previous.value) * 100;

  return {
    currentValue: current.value,
    currentRefDate: current.refDate,
    previousValue: previous.value,
    previousRefDate: previous.refDate,
    changePercent,
  };
}
