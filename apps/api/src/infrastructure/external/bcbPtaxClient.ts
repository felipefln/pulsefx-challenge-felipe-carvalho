import { normalizeToISODate } from "@pulsefx/shared";

const BASE_URL = "https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata";

/** Um par (data de referência, valor) já normalizado, pronto para persistir como Observation. */
export interface PtaxObservation {
  refDate: string;
  value: number;
}

interface OlindaPtaxResponse {
  value: Array<{
    cotacaoCompra: number;
    cotacaoVenda: number;
    dataHoraCotacao: string;
  }>;
}

/** Formata uma Date como MM-DD-YYYY, o formato exigido pelos filtros OData da Olinda. */
function toOlindaDate(date: Date): string {
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const year = date.getUTCFullYear();
  return `${month}-${day}-${year}`;
}

/**
 * Busca a cotação PTAX do dólar (USD/BRL) num intervalo de datas via BCB
 * Olinda. Usamos "cotacaoVenda" como o valor canônico do indicador — é a
 * taxa mais comumente citada como "o dólar" no noticiário financeiro
 * brasileiro (ver README, seção de séries escolhidas). O BCB só publica um
 * boletim de fechamento por dia útil, então não há necessidade de filtrar
 * duplicatas por data.
 */
export async function fetchPtaxRange(startDate: Date, endDate: Date): Promise<PtaxObservation[]> {
  const url =
    `${BASE_URL}/CotacaoDolarPeriodo(dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)` +
    `?@dataInicial='${toOlindaDate(startDate)}'&@dataFinalCotacao='${toOlindaDate(endDate)}'` +
    `&$top=1000&$format=json&$select=cotacaoCompra,cotacaoVenda,dataHoraCotacao`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`BCB PTAX respondeu ${response.status} para o intervalo solicitado`);
  }

  const body = (await response.json()) as OlindaPtaxResponse;

  return body.value.map((item) => ({
    refDate: normalizeToISODate(item.dataHoraCotacao),
    value: item.cotacaoVenda,
  }));
}
