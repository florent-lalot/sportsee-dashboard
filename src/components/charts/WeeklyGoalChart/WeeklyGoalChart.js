"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import styles from "./WeeklyGoalChart.module.css";

export default function WeeklyGoalChart({ done, goal }) {
  const remaining = Math.max(0, goal - done);

  const segments = [
    { name: "restantes", value: remaining },
    { name: "réalisées", value: done },
  ];

  return (
    <section className={styles.card}>
      <h3 className={styles.title}>
        x{done} <span className={styles.goal}>sur objectif de {goal}</span>
      </h3>
      <p className={styles.subtitle}>Courses hebdomadaires réalisées</p>

      <div className={styles.chart}>
        <span className={styles.legendTop}>
          <span
            className={`${styles.dot} ${styles.dotLeft}`}
            aria-hidden="true"
          />
          {remaining} restantes
        </span>

        <ResponsiveContainer width="100%" height={210}>
          <PieChart>
            <Pie
              data={segments}
              dataKey="value"
              innerRadius={39}
              outerRadius={82}
              startAngle={90}
              endAngle={-270}
              stroke="none"
              isAnimationActive={false}
            >
              <Cell className={styles.left} />
              <Cell className={styles.done} />
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <span className={styles.legendBottom}>
          <span
            className={`${styles.dot} ${styles.dotDone}`}
            aria-hidden="true"
          />
          {done} réalisées
        </span>
      </div>
    </section>
  );
}
