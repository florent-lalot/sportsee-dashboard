"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import styles from "./HeartRateChart.module.css";

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const { min, max, average } = payload[0].payload;

  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipDay}>{label}</p>
      <p className={styles.tooltipRow}>Min : {min ?? "—"}</p>
      <p className={styles.tooltipRow}>Max : {max ?? "—"}</p>
      <p className={styles.tooltipRow}>Moyenne : {average ?? "—"}</p>
    </div>
  );
}

export default function HeartRateChart({
  data,
  averageBpm,
  periodLabel,
  onPrevious,
  onNext,
  canPrevious = true,
  canNext = true,
}) {
  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <div>
          <h3 className={styles.value}>{averageBpm} BPM</h3>
          <p className={styles.subtitle}>Fréquence cardiaque moyenne</p>
        </div>

        <div className={styles.period}>
          <button
            type="button"
            onClick={onPrevious}
            disabled={!canPrevious}
            aria-label="Période précédente"
          >
            &#8249;
          </button>
          <span>{periodLabel}</span>
          <button
            type="button"
            onClick={onNext}
            disabled={!canNext}
            aria-label="Période suivante"
          >
            &#8250;
          </button>
        </div>
      </header>

      <div className={styles.chart}>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 20, left: 0 }}
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="2 4"
              stroke="var(--color-border)"
            />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={{ stroke: "var(--color-border)" }}
              tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
              dy={20}
            />
            <YAxis
              domain={[
                (min) => Math.floor(min - 10),
                (max) => Math.ceil(max + 6),
              ]}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
              width={44}
            />
            <Tooltip content={<ChartTooltip />} cursor={false} />

            <Bar
              dataKey="min"
              barSize={16}
              radius={[8, 8, 8, 8]}
              className={styles.barMin}
            />
            <Bar
              dataKey="max"
              barSize={16}
              radius={[8, 8, 8, 8]}
              className={styles.barMax}
            />
            <Line
              type="monotone"
              dataKey="average"
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <ul className={styles.legend}>
        <li>
          <span
            className={`${styles.dot} ${styles.dotMin}`}
            aria-hidden="true"
          />
          Min
        </li>
        <li>
          <span
            className={`${styles.dot} ${styles.dotMax}`}
            aria-hidden="true"
          />
          Max BPM
        </li>
        <li>
          <span
            className={`${styles.dot} ${styles.dotAvg}`}
            aria-hidden="true"
          />
          Moy BPM
        </li>
      </ul>
    </section>
  );
}
