import { fillBand, fillStatusLabel } from "../lib/format";

const STYLES: Record<
  ReturnType<typeof fillBand>,
  string
> = {
  risk: "bg-heat-red-soft text-heat-red ring-1 ring-heat-red/25",
  attention: "bg-heat-amber-soft text-heat-amber-ink ring-1 ring-heat-amber/30",
  over: "bg-heat-amber-soft text-heat-amber-ink ring-1 ring-heat-amber/30",
  ontrack: "bg-heat-green-soft text-heat-green ring-1 ring-heat-green/25",
  none: "bg-page text-ink-secondary ring-1 ring-border",
};

export default function StatusBadge({ pct }: { pct: number | null }) {
  const band = fillBand(pct);
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${STYLES[band]}`}
    >
      {fillStatusLabel(pct)}
    </span>
  );
}
