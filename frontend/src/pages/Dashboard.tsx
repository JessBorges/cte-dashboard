import { useState, useMemo, useDeferredValue, startTransition } from "react";
import { useSnapshotData } from "../hooks/useData";
import StatsBar from "../components/StatsBar";
import CampusTable from "../components/CampusTable";
import { campusFill, formatCount } from "../lib/format";
import { Search, FileX } from "lucide-react";

export default function Dashboard() {
  const { data, loading, error } = useSnapshotData("latest");
  const [riskOnly, setRiskOnly] = useState(false);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const isStale = search !== deferredSearch;

  const allCampuses = useMemo(
    () => (data ? data.campuses.filter((c) => !c.is_ci) : []),
    [data]
  );

  const campuses = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    const matched: (typeof allCampuses) = [];

    for (const c of allCampuses) {
      if (q && !c.campus.toLowerCase().includes(q)) continue;
      const fill = campusFill(c);
      if (riskOnly && (fill === null || fill >= 0.5)) continue;
      matched.push(c);
    }

    matched.sort((a, b) => a.campus.localeCompare(b.campus));
    return matched;
  }, [allCampuses, riskOnly, deferredSearch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-surface">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8 bg-surface">
        <FileX size={48} strokeWidth={1} className="text-ink-faint mb-6" aria-hidden />
        <p className="text-xl font-semibold text-ink mb-2">No enrollment data yet</p>
        <p className="text-sm text-ink-tertiary max-w-md">
          Open <span className="font-semibold text-accent">Data</span> and upload an
          EnrollmentByCourse file.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-w-0 bg-surface">
      <div className="flex-1 overflow-y-auto min-w-0">
        <div className="px-8 md:px-12 lg:px-16 py-8 md:py-10 max-w-[1400px]">
          <StatsBar campuses={allCampuses} label={data.snapshot.label} title="9th Grade" />

          <section className="mt-10 pt-8 border-t border-border">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <h2 className="text-lg font-semibold text-ink tracking-tight">
                Campuses
              </h2>
              <p className="text-sm text-ink-tertiary tabular">
                {formatCount(campuses.length)} shown
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-6">
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
                  placeholder="Search campus…"
                  aria-label="Search campus"
                  className="w-full h-10 pl-10 pr-3 text-sm border border-border bg-page shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:border-accent placeholder:text-ink-faint"
                />
              </div>

              <button
                type="button"
                onClick={() => startTransition(() => setRiskOnly((v) => !v))}
                aria-pressed={riskOnly}
                className={`btn-box h-10 px-4 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-accent/35 ${
                  riskOnly
                    ? "bg-heat-red text-white border-heat-red shadow-md"
                    : "bg-surface text-ink-secondary"
                }`}
              >
                Below 50% only
              </button>
            </div>

            {campuses.length === 0 ? (
              <div className="flex items-center justify-center py-20 text-ink-tertiary">
                <p className="text-sm">No campuses match</p>
              </div>
            ) : (
              <div
                className={`transition-opacity duration-150 ${
                  isStale ? "opacity-60" : "opacity-100"
                }`}
              >
                <CampusTable campuses={campuses} />
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
