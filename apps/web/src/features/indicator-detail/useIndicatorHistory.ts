import type { IndicatorHistoryResponse } from "@pulsefx/shared";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../api/httpClient";

/** Busca a série temporal + metadados de um indicador (GET /indicators/:code/history). */
export function useIndicatorHistory(code: string) {
  return useQuery({
    queryKey: ["indicator-history", code],
    queryFn: () => apiFetch<IndicatorHistoryResponse>(`/indicators/${code}/history`),
  });
}
