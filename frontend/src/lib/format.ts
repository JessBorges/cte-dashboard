/** Shared formatting + heat rules for consistent dashboard language. */

export function formatCount(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (abs >= 10_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return Math.round(n).toLocaleString("en-US");
}

export function formatPct(pct: number | null, digits = 0): string {
  if (pct === null || !Number.isFinite(pct)) return "—";
  return `${(pct * 100).toFixed(digits)}%`;
}

/** Fill rate bands — red = risk, amber = attention/over-cap, green = on track (≤100%) */
export function fillBand(
  pct: number | null
): "risk" | "attention" | "ontrack" | "over" | "none" {
  if (pct === null || !Number.isFinite(pct)) return "none";
  if (pct > 1) return "over"; // over 100% is an anomaly to evaluate
  if (pct < 0.5) return "risk";
  if (pct < 0.75) return "attention";
  return "ontrack";
}

export function fillColor(pct: number | null): string {
  const band = fillBand(pct);
  if (band === "risk") return "#ef4444";
  if (band === "attention" || band === "over") return "#f59e0b";
  if (band === "ontrack") return "#10b981";
  return "#94a3b8";
}

export function fillTrack(pct: number | null): string {
  const band = fillBand(pct);
  if (band === "risk") return "#fef2f2";
  if (band === "attention" || band === "over") return "#fffbeb";
  if (band === "ontrack") return "#ecfdf5";
  return "#f1f5f9";
}

export function fillStatusLabel(pct: number | null): string {
  if (pct === null) return "No seat target";
  if (pct > 1) return "Evaluate";
  if (pct >= 1) return "At Capacity";
  if (pct >= 0.75) return "On Track";
  if (pct >= 0.5) return "Needs Attention";
  return "At Risk";
}

export function campusFill(campus: { total_seats: number; total_enrolled: number }): number | null {
  return campus.total_seats > 0 ? campus.total_enrolled / campus.total_seats : null;
}

/** Lowest fill among programs that have a seat target; null if none. */
export function worstProgram(
  programs: { name: string; seats: number | null; enrolled: number }[]
): { name: string; pct: number } | null {
  let worst: { name: string; pct: number } | null = null;
  for (const p of programs) {
    if (p.seats == null || p.seats <= 0) continue;
    const pct = p.enrolled / p.seats;
    if (!worst || pct < worst.pct) worst = { name: p.name, pct };
  }
  return worst;
}

/** Severity rank — lower = worse (over-cap / risk before green). */
function bandRank(pct: number): number {
  const band = fillBand(pct);
  if (band === "over") return 0;
  if (band === "risk") return 1;
  if (band === "attention") return 2;
  if (band === "ontrack") return 3;
  return 4;
}

/**
 * Pct used for campus heat/status color.
 * Campus must not show green if any program with seats is not green —
 * we color by the worst band among campus overall fill and program fills.
 * The displayed fill % can still be the overall campusFill().
 */
export function campusHeatPct(campus: {
  total_seats: number;
  total_enrolled: number;
  programs?: { seats: number | null; enrolled: number }[];
  feeders?: {
    programs?: { seats: number | null; enrolled: number }[];
  }[];
}): number | null {
  const pcts: number[] = [];
  const overall = campusFill(campus);
  if (overall !== null) pcts.push(overall);

  const programs = [
    ...(campus.programs || []),
    ...((campus.feeders || []).flatMap((f) => f.programs || [])),
  ];
  for (const p of programs) {
    if (p.seats == null || p.seats <= 0) continue;
    pcts.push(p.enrolled / p.seats);
  }
  if (!pcts.length) return null;
  return pcts.reduce((a, b) => (bandRank(a) <= bandRank(b) ? a : b));
}
