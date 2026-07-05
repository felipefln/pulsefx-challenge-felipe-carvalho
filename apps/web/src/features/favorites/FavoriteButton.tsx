import { useToggleFavorite } from "./useToggleFavorite";
import "./FavoriteButton.css";

interface FavoriteButtonProps {
  code: string;
  isFavorite: boolean;
}

/** Estrela de favorito reutilizada pelo card do dashboard e pela tela de detalhe. */
export function FavoriteButton({ code, isFavorite }: FavoriteButtonProps) {
  const { mutate, isPending } = useToggleFavorite();

  return (
    <button
      type="button"
      className="favorite-button"
      aria-pressed={isFavorite}
      aria-label={isFavorite ? "Remover dos meus indicadores" : "Adicionar aos meus indicadores"}
      disabled={isPending}
      onClick={() => mutate({ code, isFavorite })}
    >
      {isFavorite ? "★" : "☆"}
    </button>
  );
}
