import { Link, useParams } from "react-router-dom";
import { HistoryChart } from "./HistoryChart";
import { HistoryTable } from "./HistoryTable";
import { useIndicatorHistory } from "./useIndicatorHistory";
import "./IndicatorDetailPage.css";

export function IndicatorDetailPage() {
  const { code } = useParams<{ code: string }>();
  const { data: history, isLoading, isError } = useIndicatorHistory(code ?? "");

  return (
    <main>
      <Link to="/" className="indicator-detail__back">
        ← Voltar ao dashboard
      </Link>

      {isLoading && <p role="status">Carregando histórico...</p>}
      {isError && <p role="alert">Não foi possível carregar o histórico. Tente novamente mais tarde.</p>}

      {history && (
        <>
          <h1>{history.name}</h1>
          <p className="indicator-detail__description">{history.description}</p>

          {history.observations.length > 0 ? (
            <>
              <HistoryChart observations={history.observations} unit={history.unit} />
              <HistoryTable observations={history.observations} unit={history.unit} />
            </>
          ) : (
            <p className="indicator-detail__empty">Ainda não há observações sincronizadas para este indicador.</p>
          )}

          <p className="indicator-detail__limitations">{history.limitationsNote}</p>
        </>
      )}
    </main>
  );
}
