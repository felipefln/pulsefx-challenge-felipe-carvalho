import type { IndicatorSummary } from "@pulsefx/shared";
import "./IndicatorCard.css";

interface IndicatorCardProps {
  indicator: IndicatorSummary;
}

/** Formata o valor conforme a unidade do indicador — BRL com 4 casas (padrão PTAX), % com 2. */
function formatValue(value: number, unit: string | null): string {
  if (unit === "BRL") {
    return `R$ ${value.toFixed(4)}`;
  }
  if (unit === "%") {
    return `${value.toFixed(2)}%`;
  }
  return value.toString();
}

/** refDate vem como "YYYY-MM-DD"; força meia-noite UTC pra não virar o dia anterior no fuso local. */
function formatRefDate(refDate: string): string {
  return new Date(`${refDate}T00:00:00Z`).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

type Trend = "up" | "down" | "neutral";

function resolveTrend(changePercent: number | null): Trend {
  if (changePercent === null || changePercent === 0) {
    return "neutral";
  }
  return changePercent > 0 ? "up" : "down";
}

export function IndicatorCard({ indicator }: IndicatorCardProps) {
  const { name, description, unit, latestObservation, variation } = indicator;

  if (!latestObservation) {
    return (
      <article className="indicator-card">
        <h2>{name}</h2>
        <p className="indicator-card__description">{description}</p>
        <p className="indicator-card__empty">Ainda não sincronizado</p>
      </article>
    );
  }

  const changePercent = variation?.changePercent ?? null;
  const trend = resolveTrend(changePercent);

  return (
    <article className="indicator-card">
      <h2>{name}</h2>
      <p className="indicator-card__description">{description}</p>
      <p className="indicator-card__value">{formatValue(latestObservation.value, unit)}</p>
      <p className="indicator-card__date">Referência: {formatRefDate(latestObservation.refDate)}</p>
      {changePercent === null ? (
        <p className="indicator-card__variation indicator-card__variation--neutral">Sem histórico suficiente</p>
      ) : (
        <p className={`indicator-card__variation indicator-card__variation--${trend}`}>
          {trend === "up" ? "▲" : trend === "down" ? "▼" : "•"} {Math.abs(changePercent).toFixed(2)}%
        </p>
      )}
    </article>
  );
}
