const BASE_URL = "https://api.stlouisfed.org/fred/series/observations";

/** Um par (data de referência, valor) já normalizado, pronto para persistir como Observation. */
export interface FredObservation {
  refDate: string;
  value: number;
}

interface FredApiResponse {
  observations: Array<{ date: string; value: string }>;
}

/**
 * Busca observações de uma série do FRED (ex.: FEDFUNDS) num intervalo de
 * datas. Requer a env FRED_API_KEY (registro em
 * fredaccount.stlouisfed.org/apikeys). O FRED já retorna a data em ISO
 * ("YYYY-MM-DD"), então não precisa de normalização adicional.
 *
 * Observações com value "." (convenção do FRED para dado ausente/não
 * publicado ainda) são descartadas — nunca fingimos um valor que a fonte
 * não publicou, mesma regra de "nunca interpolar" aplicada aos dados do BCB.
 */
export async function fetchFredSeries(
  seriesId: string,
  startDate: Date,
  endDate: Date,
): Promise<FredObservation[]> {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    throw new Error("FRED_API_KEY não configurada");
  }

  const params = new URLSearchParams({
    series_id: seriesId,
    api_key: apiKey,
    file_type: "json",
    observation_start: startDate.toISOString().slice(0, 10),
    observation_end: endDate.toISOString().slice(0, 10),
  });

  const response = await fetch(`${BASE_URL}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`FRED (série ${seriesId}) respondeu ${response.status} para o intervalo solicitado`);
  }

  const body = (await response.json()) as FredApiResponse;

  return body.observations
    .filter((observation) => observation.value !== ".")
    .map((observation) => ({
      refDate: observation.date,
      value: Number(observation.value),
    }));
}
