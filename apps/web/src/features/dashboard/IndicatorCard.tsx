import type { IndicatorSummary } from "@pulsefx/shared";
import { Link } from "react-router-dom";
import { FavoriteButton } from "../favorites/FavoriteButton";
import { formatRefDate, formatValue } from "../../lib/format";
import "./IndicatorCard.css";

interface IndicatorCardProps {
  indicator: IndicatorSummary;
}

type Trend = "up" | "down" | "neutral";

function resolveTrend(changePercent: number | null): Trend {
  if (changePercent === null || changePercent === 0) {
    return "neutral";
  }
  return changePercent > 0 ? "up" : "down";
}

export function IndicatorCard({ indicator }: IndicatorCardProps) {
  const { code, name, description, unit, latestObservation, variation, isFavorite } = indicator;

  if (!latestObservation) {
    return (
      <article className="indicator-card">
        <div className="indicator-card__header">
          <h2>
            <Link to={`/indicators/${code}`}>{name}</Link>
          </h2>
          <FavoriteButton code={code} isFavorite={isFavorite} />
        </div>
        <p className="indicator-card__description">{description}</p>
        <p className="indicator-card__empty">Ainda não sincronizado</p>
      </article>
    );
  }

  const changePercent = variation?.changePercent ?? null;
  const trend = resolveTrend(changePercent);

  return (
    <article className="indicator-card">
      <div className="indicator-card__header">
        <h2>
          <Link to={`/indicators/${code}`}>{name}</Link>
        </h2>
        <FavoriteButton code={code} isFavorite={isFavorite} />
      </div>
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
