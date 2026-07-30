import type { TierKey } from "./TierBadge";

const COLORS: Record<TierKey, string> = {
  t1: "#2563eb",
  t2: "#10b981",
  t3: "#f59e0b",
  none: "#ef4444",
};

const LABELS: Record<TierKey, string> = {
  t1: "Tier 1",
  t2: "Tier 2",
  t3: "Tier 3",
  none: "No tier",
};

export default function TierBarChart({
  values,
  onSelect,
  active,
}: {
  values: { key: TierKey; value: number }[];
  onSelect?: (key: TierKey) => void;
  active?: TierKey | "all" | null;
}) {
  const max = Math.max(...values.map((v) => v.value), 1);

  return (
    <div className="space-y-3" role="img" aria-label="IBCs earned by TEA tier">
      {values.map((v) => {
        const pct = Math.round((v.value / max) * 100);
        const isActive = active === v.key;
        return (
          <button
            key={v.key}
            type="button"
            onClick={() => onSelect?.(v.key)}
            aria-pressed={isActive}
            className={`btn-box w-full text-left px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-accent/35 ${
              isActive ? "is-active bg-primary-soft" : "bg-surface"
            }`}
          >
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <span className="text-sm font-medium text-ink">{LABELS[v.key]}</span>
              <span className="font-mono text-sm font-bold tabular text-ink">
                {v.value.toLocaleString()}
              </span>
            </div>
            <div className="h-3 bg-surface overflow-hidden border border-border/60">
              <div
                className="h-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: COLORS[v.key] }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
