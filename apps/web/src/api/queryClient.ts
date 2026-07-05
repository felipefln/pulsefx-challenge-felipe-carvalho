import { QueryClient } from "@tanstack/react-query";

/**
 * `staleTime` de 1 minuto: os dados vêm do Postgres já sincronizado pela API
 * (Fase 4), não de uma fonte que muda a cada request — não faz sentido
 * refetch a cada foco de janela. `retry: 1` evita martelar a API em caso de
 * erro real (ex.: indicador não encontrado).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
});
