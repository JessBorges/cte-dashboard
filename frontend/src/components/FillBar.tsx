import { fillBand, fillColor, fillTrack, formatCount, formatPct } from "../lib/format";

interface FillBarProps {
  pct: number | null;
  seats: number;
  enrolled: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

function textColor(pct: number): string {
  const band = fillBand(pct);
  if (band === "ontrack") return "text-heat-green";
  if (band === "attention" || band === "over") return "text-heat-amber";
  return "text-heat-red";
}

export default function FillBar({
  pct,
  seats,
  enrolled,
  size = "md",
  showLabel = true,
}: FillBarProps) {
  if (pct === null || seats <= 0) {
    return (
      <span className="font-mono text-xs sm:text-sm tabular text-ink-tertiary whitespace-nowrap">
        {formatCount(enrolled)} enrolled
      </span>
    );
  }

  // Bars always fill from 0% (principle 8 — honest scale)
  const clamped = Math.min(Math.max(pct, 0), 1);
  const h = size === "sm" ? "h-2" : size === "lg" ? "h-4" : "h-3";

  return (
    <div className="flex items-center gap-2 sm:gap-3 min-w-0 w-full">
      <div
        className={`flex-1 min-w-0 ${h} overflow-hidden`}
        style={{ backgroundColor: fillTrack(pct) }}
      >
        <div
          className="h-full transition-all duration-700 ease-out"
          style={{ width: `${clamped * 100}%`, backgroundColor: fillColor(pct) }}
        />
      </div>
      {showLabel && (
        <span className={`font-mono text-xs sm:text-sm font-semibold tabular shrink-0 w-9 text-right ${textColor(pct)}`}>
          {formatPct(pct)}
        </span>
      )}
    </div>
  );
}

export { fillColor as heatColor, fillTrack as heatBg, textColor as heatText };
