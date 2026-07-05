import "./Disclaimer.css";

/** Exigido pelo MVP: visível em toda página, não só na tela de detalhe. */
export function Disclaimer() {
  return (
    <p className="disclaimer">
      Conteúdo educacional a partir de fontes públicas (BCB, FRED). Não é recomendação de investimento.
    </p>
  );
}
