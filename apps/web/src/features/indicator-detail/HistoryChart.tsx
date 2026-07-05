import type { Observation } from "@pulsefx/shared";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatRefDate, formatValue } from "../../lib/format";
import "./HistoryChart.css";

interface HistoryChartProps {
  observations: Observation[];
  unit: string | null;
}

/** Tick curto de eixo X — o rótulo completo (com ano) fica reservado pro tooltip e pra tabela ao lado. */
function shortTick(refDate: string): string {
  const [, month, day] = refDate.split("-");
  return `${day}/${month}`;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: Observation }>;
  unit: string | null;
}

/**
 * Tooltip customizado: valor em destaque, data em segundo plano (valor lidera,
 * rótulo acompanha) — o leitor já sabe qual série é, quer é o número.
 */
function ChartTooltip({ active, payload, unit }: ChartTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }
  const observation = payload[0].payload;
  return (
    <div className="history-chart__tooltip">
      <strong>{formatValue(observation.value, unit)}</strong>
      <span>{formatRefDate(observation.refDate)}</span>
    </div>
  );
}

/** Série única — sem legenda (o título da página já diz o que é plotado), linha 2px na cor de destaque do tema. */
export function HistoryChart({ observations, unit }: HistoryChartProps) {
  return (
    <div className="history-chart">
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={observations} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="refDate"
            tickFormatter={shortTick}
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={64}
            domain={["auto", "auto"]}
            tickFormatter={(value: number) => formatValue(value, unit)}
          />
          <Tooltip content={<ChartTooltip unit={unit} />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--accent)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "var(--accent)", stroke: "var(--bg-card)", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
