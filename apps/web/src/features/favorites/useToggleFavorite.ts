import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/httpClient";

interface ToggleFavoriteInput {
  code: string;
  isFavorite: boolean;
}

/**
 * Favorita/desfavorita um indicador. isFavorite já vem calculado pelo
 * backend em GET /indicators (via X-Anonymous-Id) — depois da mutação só
 * invalidamos essa query em vez de manter um segundo estado de favoritos
 * duplicado no frontend.
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ code, isFavorite }: ToggleFavoriteInput) => {
      await apiFetch(`/favorites/${code}`, { method: isFavorite ? "DELETE" : "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["indicators"] });
    },
  });
}
