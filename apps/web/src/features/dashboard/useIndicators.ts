import type { IndicatorSummary } from "@pulsefx/shared";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../api/httpClient";

interface IndicatorsResponse {
  indicators: IndicatorSummary[];
}

/** Busca os cards do dashboard (GET /indicators). Cache/retry vêm do queryClient global. */
export function useIndicators() {
  return useQuery({
    queryKey: ["indicators"],
    queryFn: async () => (await apiFetch<IndicatorsResponse>("/indicators")).indicators,
  });
}
