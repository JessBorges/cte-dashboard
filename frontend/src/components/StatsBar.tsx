import type { Campus } from "../hooks/useData";
import {
  campusHeatPct,
  fillBand,
  fillColor,
  formatCount,
  formatPct,
} from "../lib/format";

interface Props {
  campuses: Campus[];
  label: string;
  title?: string;
}

export default function StatsBar({
  campuses,
  label,
  title = "Dashboard",
}: Props) {
  const totalSeats = campuses.reduce((s, c) => s + c.total_seats, 0);
  const totalEnrolled = campuses.reduce((s, c) => s + c.total_enrolled, 0);
  const pct = totalSeats > 0 ? totalEnrolled / totalSeats : null;
  let atRisk = 0;
  let onTrack = 0;
  for (const c of campuses) {
    const heat = campusHeatPct(c);
    if (heat === null) continue;
    const band = fillBand(heat);
    if (band === "risk") atRisk += 1;
    // Green only when campus AND all programs are on track (≤100%)
    if (band === "ontrack") onTrack += 1;
  }

  return (
    <header className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl md:text-4xl font-bold text-ink tracking-tight">
          {title}
        </h1>
        <p className="text-base text-ink-secondary pb-1">{label}</p>
      </div>

      <div className="flex flex-wrap gap-x-10 gap-y-5">
        <Kpi
          color={fillColor(pct)}
          value={formatPct(pct)}
          label="District fill"
        />
        <Kpi
          color="#00948f"
          value={
            pct !== null
              ? `${formatCount(totalEnrolled)} / ${formatCount(totalSeats)}`
              : "—"
          }
          label="Seats filled"
        />
        <Kpi
          color={atRisk > 0 ? "#ef4444" : "#10b981"}
          value={formatCount(atRisk)}
          label="Below 50%"
        />
        <Kpi
          color="#10b981"
          value={formatCount(onTrack)}
          label="On track (≥75%)"
        />
      </div>
    </header>
  );
}

function Kpi({
  color,
  value,
  label,
}: {
  color: string;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-start gap-3 min-w-[8rem]">
      <span
        className="mt-2 size-2.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <div>
        <p className="font-mono text-2xl md:text-3xl font-bold tabular leading-none tracking-tight text-ink">
          {value}
        </p>
        <p className="text-sm text-ink-secondary mt-1.5">{label}</p>
      </div>
    </div>
  );
}
