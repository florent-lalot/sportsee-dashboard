"use client";

import { useEffect } from "react";

/**
 * Ancre les animations d'un SVG sur l'origine de la timeline du document.
 *
 * Une animation CSS demarre quand son element apparait : deux logos montes
 * a quelques millisecondes d'intervalle se retrouvent dephases. En forçant
 * startTime a 0, chaque animation se comporte comme si elle avait demarre
 * au chargement de la page. Tous les logos restent donc en phase, quel que
 * soit le moment ou ils apparaissent.
 *
 * @param {React.RefObject<SVGSVGElement>} ref - reference vers le <svg>
 */
export function useSyncedBars(ref) {
  useEffect(() => {
    const svg = ref.current;
    if (!svg?.getAnimations) return;

    for (const animation of svg.getAnimations({ subtree: true })) {
      try {
        animation.startTime = 0;
      } catch {
        // Certaines animations n'acceptent pas d'etre repositionnees : on ignore.
      }
    }
  }, [ref]);
}
