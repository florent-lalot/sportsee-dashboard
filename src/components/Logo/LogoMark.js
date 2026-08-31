"use client";

import { useRef } from "react";
import { useSyncedBars } from "./useSyncedBars";
import styles from "./Logo.module.css";

/**
 * Pictogramme seul (sans le mot SPORTSEE), avec la meme animation
 * d'egaliseur que le logo complet. Utilise dans le footer.
 *
 * Les identifiants de degrade sont suffixes "Mark" pour ne pas entrer
 * en collision avec ceux du composant Logo, present sur la meme page.
 *
 * @param {number} size - hauteur en pixels (la largeur suit le ratio 19/21)
 */
export default function LogoMark({ size = 20, className = "" }) {
  const ref = useRef(null);
  useSyncedBars(ref);

  return (
    <svg
      ref={ref}
      className={className}
      width={Math.round((size * 19) / 21)}
      height={size}
      viewBox="0 0 19 21"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="SportSee"
    >
      <rect className={styles.bar0} x="4" y="5.65625" width="3" height="15" rx="1.5" fill="url(#gradDownMark)" />
      <rect className={styles.bar1} x="4" y="0" width="3" height="14" rx="1.5" fill="url(#gradUpMark)" />
      <rect x="16" y="11.3281" width="3" height="6" rx="1.5" fill="url(#gradDownMark)" />
      <rect className={styles.bar3} x="16" y="0" width="3" height="14" rx="1.5" fill="url(#gradUpMark)" />
      <rect x="12" y="11" width="3" height="9" rx="1.5" fill="url(#gradDownMark)" />
      <rect className={styles.bar5} x="12" y="5" width="3" height="9" rx="1.5" fill="url(#gradUpMark)" />
      <rect x="8" y="11.3281" width="3" height="5" rx="1.5" fill="url(#gradDownMark)" />
      <rect className={styles.bar7} x="8" y="2" width="3" height="12" rx="1.5" fill="url(#gradUpMark)" />
      <rect x="0" y="11" width="3" height="8" rx="1.5" fill="url(#gradDownMark)" />
      <rect className={styles.bar9} x="0" y="3.3281" width="3" height="11" rx="1.5" fill="url(#gradUpMark)" />

      <defs>
        <linearGradient id="gradDownMark" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#F4320B" />
          <stop offset="1" stopColor="#5465F7" />
        </linearGradient>
        <linearGradient id="gradUpMark" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#F99885" />
          <stop offset="1" stopColor="#DF392B" />
        </linearGradient>
      </defs>
    </svg>
  );
}
