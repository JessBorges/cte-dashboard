import { useMemo, useState, startTransition } from "react";
import { useIbcCerts } from "../hooks/useData";
import { Search } from "lucide-react";
import TierBadge, { TierDot, tierKeyFrom, type TierKey } from "../components/TierBadge";
import { formatCount } from "../lib/format";

const TIER_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "All tiers" },
  { value: "t1", label: "Tier 1" },
  { value: "t2", label: "Tier 2" },
  { value: "t3", label: "Tier 3" },
  { value: "none", label: "No tier" },
];

export default function IbcCerts() {
  const { data, loading, error } = useIbcCerts();
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState<string>("all");

  const list = useMemo(() => {
    let rows = [...data];
    if (tier !== "all") {
      rows = rows.filter((c) => tierKeyFrom(c.tier, c.tier_key) === tier);
    }
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          String(c.cert_code || "").includes(q)
      );
    }
    rows.sort((a, b) => b.earned - a.earned);
    return rows;
  }, [data, search, tier]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-surface">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full overflow-y-auto bg-surface">
        <div className="px-8 md:px-12 lg:px-16 py-8 md:py-10 max-w-[1400px]">
          <h1 className="text-3xl md:text-4xl font-bold text-ink tracking-tight mb-2">
            Cert Search
          </h1>
          <p className="text-base text-ink-secondary">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-w-0 bg-surface">
      <div className="flex-1 overflow-y-auto min-w-0">
        <div className="px-8 md:px-12 lg:px-16 py-8 md:py-10 max-w-[1400px]">
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-ink tracking-tight">
              Cert Search
            </h1>
            <p className="text-base text-ink-secondary mt-1.5">
              All IBCs from the weekly tracker · filter by TEA tier
            </p>
          </header>

          <section className="pt-8 border-t border-border">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <h2 className="text-lg font-semibold text-ink tracking-tight">
                Certifications
              </h2>
              <p className="text-sm text-ink-tertiary tabular">
                {formatCount(list.length)} shown
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="relative w-full sm:w-72 max-w-full">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none"
                  aria-hidden
                />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search cert…"
                  aria-label="Search certification"
                  className="w-full h-10 pl-10 pr-3 text-sm border border-border bg-page shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:border-accent placeholder:text-ink-faint"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Filter by tier">
              {TIER_FILTERS.map((f) => {
                const active = tier === f.value;
                return (
                  <button
                    key={f.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => startTransition(() => setTier(f.value))}
                    className={`btn-box h-10 px-4 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-accent/35 inline-flex items-center gap-2 ${
                      active
                        ? "is-active bg-primary text-white border-primary"
                        : "bg-surface text-ink-secondary"
                    }`}
                  >
                    {f.value !== "all" ? (
                      <TierDot tierKey={f.value as TierKey} />
                    ) : null}
                    {f.label}
                  </button>
                );
              })}
            </div>

            <div className="panel bg-surface">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-page/80">
                      <th className="px-5 py-3.5 text-xs font-semibold text-ink-secondary">
                        Certification
                      </th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-ink-secondary">
                        Tier
                      </th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-ink-secondary">
                        Earned
                      </th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-ink-secondary">
                        Projected
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((c) => (
                      <tr
                        key={c.name + (c.cert_code || "")}
                        className="border-b border-border/70 hover:bg-page/90"
                      >
                        <td className="px-5 py-3.5 text-base text-ink">{c.name}</td>
                        <td className="px-4 py-3.5">
                          <TierBadge tier={c.tier} tierKey={c.tier_key} />
                        </td>
                        <td className="px-4 py-3.5 font-mono text-base font-semibold tabular">
                          {c.earned.toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-base tabular text-ink-secondary">
                          {c.projected != null
                            ? Number(c.projected).toLocaleString()
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!list.length ? (
                <p className="px-5 py-8 text-base text-ink-tertiary">
                  No certifications match
                </p>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
