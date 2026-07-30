/** Tier color coding: T1 blue · T2 green · T3 yellow · none red */

export type TierKey = "t1" | "t2" | "t3" | "none";

const STYLES: Record<TierKey, string> = {
  t1: "bg-[#dbeafe] text-[#1d4ed8] ring-1 ring-[#93c5fd]",
  t2: "bg-heat-green-soft text-[#047857] ring-1 ring-heat-green/30",
  t3: "bg-heat-amber-soft text-heat-amber-ink ring-1 ring-heat-amber/35",
  none: "bg-heat-red-soft text-[#b91c1c] ring-1 ring-heat-red/30",
};

const LABELS: Record<TierKey, string> = {
  t1: "Tier 1",
  t2: "Tier 2",
  t3: "Tier 3",
  none: "No tier",
};

export function tierKeyFrom(tier?: string | null, tierKey?: string | null): TierKey {
  if (tierKey === "t1" || tierKey === "t2" || tierKey === "t3" || tierKey === "none") {
    return tierKey;
  }
  const t = (tier || "").trim();
  if (t === "Tier 1") return "t1";
  if (t === "Tier 2") return "t2";
  if (t === "Tier 3") return "t3";
  return "none";
}

export default function TierBadge({
  tier,
  tierKey,
  compact = false,
}: {
  tier?: string | null;
  tierKey?: string | null;
  compact?: boolean;
}) {
  const key = tierKeyFrom(tier, tierKey);
  return (
    <span
      className={`inline-flex items-center font-semibold whitespace-nowrap ${STYLES[key]} ${
        compact ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
      }`}
    >
      {compact ? LABELS[key].replace("Tier ", "T").replace("No tier", "None") : LABELS[key]}
    </span>
  );
}

export function TierDot({ tierKey }: { tierKey: TierKey }) {
  const color =
    tierKey === "t1"
      ? "#2563eb"
      : tierKey === "t2"
        ? "#10b981"
        : tierKey === "t3"
          ? "#f59e0b"
          : "#ef4444";
  return (
    <span
      className="inline-block size-2.5 rounded-full shrink-0"
      style={{ backgroundColor: color }}
      aria-hidden
    />
  );
}
