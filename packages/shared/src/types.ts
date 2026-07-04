export type IndicatorSource = "BCB" | "FRED";

export type IndicatorFrequency = "DAILY" | "MONTHLY";

export interface Indicator {
  id: string;
  code: string;
  name: string;
  description: string;
  source: IndicatorSource;
  sourceSeriesId: string;
  frequency: IndicatorFrequency;
  unit: string | null;
}

export interface Observation {
  indicatorId: string;
  /** Data de referência da observação, no formato ISO "YYYY-MM-DD". */
  refDate: string;
  value: number;
}

export interface VariationResult {
  currentValue: number;
  currentRefDate: string;
  previousValue: number;
  previousRefDate: string;
  /** Variação percentual (ex.: 1.23 representa +1.23%); null quando não é possível calcular. */
  changePercent: number | null;
}
