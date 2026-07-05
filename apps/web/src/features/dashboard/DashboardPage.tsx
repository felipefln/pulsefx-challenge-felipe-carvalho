import { IndicatorCard } from "./IndicatorCard";
import "./DashboardPage.css";
import { useIndicators } from "./useIndicators";

export function DashboardPage() {
  const { data: indicators, isLoading, isError } = useIndicators();

  return (
    <main>
      <h1>Pulse FX</h1>
      <p className="dashboard-subtitle">Câmbio e indicadores macro a partir de fontes públicas (BCB, FRED).</p>

      {isLoading && <p role="status">Carregando indicadores...</p>}
      {isError && <p role="alert">Não foi possível carregar os indicadores. Tente novamente mais tarde.</p>}

      {indicators && (
        <div className="dashboard-grid">
          {indicators.map((indicator) => (
            <IndicatorCard key={indicator.code} indicator={indicator} />
          ))}
        </div>
      )}
    </main>
  );
}
