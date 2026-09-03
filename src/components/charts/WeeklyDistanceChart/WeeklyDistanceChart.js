"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import styles from "./WeeklyDistanceChart.module.css";

/** 2026-08-03 -> "03.08" */
function shortDate(date) {
  return date
    .toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })
    .replaceAll("/", ".");
}

/** Infobulle personnalisee : Recharts nous passe la donnée survolee. */
function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  const { start, end, km } = payload[0].payload;

  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipRange}>
        {shortDate(start)} au {shortDate(end)}
      </p>
      <p className={styles.tooltipValue}>{km.toLocaleString("fr-FR")} km</p>
    </div>
  );
}

export default function WeeklyDistanceChart({
  data,
  averageKm,
  periodLabel,
  onPrevious,
  onNext,
}) {
  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <div>
          <h3 className={styles.value}>{averageKm}km en moyenne</h3>
          <p className={styles.subtitle}>
            Total des kilomètres 4 dernières semaines
          </p>
        </div>

        <div className={styles.period}>
          <button
            type="button"
            onClick={onPrevious}
            aria-label="Période précédente"
          >
            &#8249;
          </button>
          <span>{periodLabel}</span>
          <button type="button" onClick={onNext} aria-label="Période suivante">
            &#8250;
          </button>
        </div>
      </header>

      <div className={styles.chart}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 20, left: 0 }}
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="2 4"
              stroke="var(--color-border)"
            />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: "var(--color-border)" }}
              tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
              dy={20}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
              width={44}
            />
            <Tooltip content={<ChartTooltip />} cursor={false} />
            <Bar
              dataKey="km"
              barSize={16}
              radius={[8, 8, 8, 8]}
              className={styles.bar}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className={styles.legend}>
        <span className={styles.dot} aria-hidden="true" />
        Km
      </p>
    </section>
  );
}
