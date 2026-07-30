import { useId, useMemo, useState } from "react";
import { useSnapshotData, type Campus } from "../hooks/useData";
import { Building2, ChevronRight, FileX } from "lucide-react";
import {
  campusFill,
  fillColor,
  fillTrack,
  formatCount,
  formatPct,
} from "../lib/format";

type FeederSeatRow = {
  campus: string;
  enrolled: number;
  seats: number;
  pct: number | null;
};

type AggregatedProgram = {
  name: string;
  enrolled: number;
  seats: number;
  pct: number | null;
  feederCount: number;
  feeders: FeederSeatRow[];
};

type CiTheme = {
  header: string;
  headerText: string;
  accent: string;
  soft: string;
  border: string;
};

const CI_ORDER = ["North", "South", "East"] as const;

const CI_THEMES: Record<(typeof CI_ORDER)[number], CiTheme> = {
  North: {
    header: "bg-[#211650]",
    headerText: "text-white",
    accent: "#211650",
    soft: "bg-[#eceaf5]",
    border: "border-[#211650]/20",
  },
  South: {
    header: "bg-[#00948f]",
    headerText: "text-white",
    accent: "#00948f",
    soft: "bg-[#e6f5f4]",
    border: "border-[#00948f]/25",
  },
  East: {
    header: "bg-[#346094]",
    headerText: "text-white",
    accent: "#346094",
    soft: "bg-[#e8eef5]",
    border: "border-[#346094]/25",
  },
};

function ciRegion(name: string): (typeof CI_ORDER)[number] | null {
  const n = name.toLowerCase();
  if (n.includes("north")) return "North";
  if (n.includes("south")) return "South";
  if (n.includes("east")) return "East";
  return null;
}

function shortCiTitle(name: string, region: string) {
  return name.replace(/^Career Institute\s*[-–—]?\s*/i, "").trim() || region;
}

/** Roll feeder programs up to CI-level program rows (with per-feeder seats). */
function aggregatePrograms(ci: Campus): AggregatedProgram[] {
  const map = new Map<
    string,
    {
      enrolled: number;
      seats: number;
      feeders: FeederSeatRow[];
    }
  >();

  for (const feeder of ci.feeders || []) {
    for (const p of feeder.programs || []) {
      const seats = p.seats || 0;
      const enrolled = p.enrolled || 0;
      const cur = map.get(p.name) || { enrolled: 0, seats: 0, feeders: [] };
      cur.enrolled += enrolled;
      cur.seats += seats;
      cur.feeders.push({
        campus: feeder.campus,
        enrolled,
        seats,
        pct: seats > 0 ? enrolled / seats : null,
      });
      map.set(p.name, cur);
    }
  }

  // Fall back to CI.programs if feeders empty
  if (map.size === 0) {
    for (const p of ci.programs || []) {
      map.set(p.name, {
        enrolled: p.enrolled || 0,
        seats: p.seats || 0,
        feeders: [],
      });
    }
  }

  return [...map.entries()]
    .map(([name, v]) => ({
      name,
      enrolled: v.enrolled,
      seats: v.seats,
      pct: v.seats > 0 ? v.enrolled / v.seats : null,
      feederCount: v.feeders.length,
      feeders: v.feeders.sort((a, b) => b.seats - a.seats || a.campus.localeCompare(b.campus)),
    }))
    .sort((a, b) => {
      const pa = a.pct ?? 2;
      const pb = b.pct ?? 2;
      return pa - pb;
    });
}

export default function CareerInstitutes() {
  const { data, loading, error } = useSnapshotData("latest");

  const columns = useMemo(() => {
    if (!data) return [];
    const cis = data.campuses.filter((c) => c.is_ci);
    const byRegion = new Map<(typeof CI_ORDER)[number], Campus>();
    for (const ci of cis) {
      const region = ciRegion(ci.campus);
      if (region) byRegion.set(region, ci);
    }
    return CI_ORDER.map((region) => {
      const ci = byRegion.get(region);
      return {
        region,
        theme: CI_THEMES[region],
        ci: ci || null,
        programs: ci ? aggregatePrograms(ci) : [],
      };
    });
  }, [data]);

  const hasAny = columns.some((c) => c.ci);

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
        <p className="text-xl font-semibold text-ink mb-2">No data yet</p>
        <p className="text-sm text-ink-tertiary">Upload enrollment data first.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-w-0 bg-surface">
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
        {/* Padding lives on the scroll container so gutters always show */}
        <div className="box-border w-full max-w-[1600px] py-8 md:py-10 pl-10 pr-10 md:pl-14 md:pr-14 lg:pl-20 lg:pr-20">
          <header className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-3xl md:text-4xl font-bold text-ink tracking-tight">
                Career Institutes
              </h1>
              <p className="text-base text-ink-secondary mt-1.5">
                North · South · East · feeder seat fill by program
              </p>
            </div>
            <p className="text-base text-ink-tertiary pb-0.5 shrink-0">
              {data.snapshot.label}
            </p>
          </header>

          {!hasAny ? (
            <div className="flex flex-col items-center justify-center py-20 text-ink-tertiary">
              <Building2 size={32} strokeWidth={1} className="mb-4 text-ink-faint" aria-hidden />
              <p className="text-sm">No Career Institute data available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 min-w-0">
              {columns.map(({ region, theme, ci, programs }) => (
                <CiColumn
                  key={region}
                  region={region}
                  theme={theme}
                  ci={ci}
                  programs={programs}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CiColumn({
  region,
  theme,
  ci,
  programs,
}: {
  region: string;
  theme: CiTheme;
  ci: Campus | null;
  programs: AggregatedProgram[];
}) {
  if (!ci) {
    return (
      <section className="min-w-0">
        <div className={`panel ${theme.soft} border ${theme.border} px-5 py-6`}>
          <h2 className="text-lg font-bold text-ink">CI {region}</h2>
          <p className="text-sm text-ink-tertiary mt-2">No data for this institute.</p>
        </div>
      </section>
    );
  }

  const pct = campusFill(ci);
  const feeders = ci.feeders || [];
  const title = shortCiTitle(ci.campus, region);

  return (
    <section
      className="min-w-0 max-w-full flex flex-col overflow-hidden"
      aria-labelledby={`ci-col-${region}`}
    >
      {/* Colored CI overview card */}
      <div
        className={`panel ${theme.header} ${theme.headerText} px-5 py-5 mb-5 border-transparent shadow-md min-w-0`}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80 mb-1">
          Career Institute
        </p>
        <h2
          id={`ci-col-${region}`}
          className="text-xl font-bold tracking-tight mb-4 break-words"
        >
          {title}
        </h2>

        <div className="flex items-end justify-between gap-3 mb-3 min-w-0">
          <span className="font-mono text-4xl font-bold tabular leading-none shrink-0">
            {formatPct(pct)}
          </span>
          <span className="text-sm tabular text-right opacity-90 leading-snug min-w-0">
            <span className="font-semibold">{formatCount(ci.total_enrolled)}</span>
            {" / "}
            {formatCount(ci.total_seats)} seats
          </span>
        </div>

        <div className="h-2.5 overflow-hidden bg-white/20 mb-3">
          {pct !== null && ci.total_seats > 0 ? (
            <div
              className="h-full bg-white transition-all duration-500"
              style={{ width: `${Math.min(Math.max(pct, 0), 1) * 100}%` }}
            />
          ) : null}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm opacity-90">
          <span>{feeders.length} feeder campuses</span>
          <span>{programs.length} programs</span>
        </div>
      </div>

      {/* Program list */}
      <div className={`panel border ${theme.border} ${theme.soft} flex-1 min-w-0 overflow-hidden`}>
        <div className="px-4 py-3 border-b border-black/5 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-ink">Programs</p>
          <p className="text-xs text-ink-tertiary shrink-0">Expand for feeder seats</p>
        </div>
        {programs.length === 0 ? (
          <p className="px-4 py-6 text-sm text-ink-tertiary">No program seat goals.</p>
        ) : (
          <ul className="divide-y divide-black/5">
            {programs.map((p) => (
              <ProgramRow key={p.name} program={p} accent={theme.accent} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function ProgramRow({
  program,
  accent,
}: {
  program: AggregatedProgram;
  accent: string;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const color = program.pct !== null ? fillColor(program.pct) : "#94a3b8";
  const track = fillTrack(program.pct);
  const hasFeeders = program.feeders.length > 0;

  return (
    <li className="bg-surface/80 min-w-0">
      <button
        type="button"
        onClick={() => hasFeeders && setOpen((v) => !v)}
        aria-expanded={hasFeeders ? open : undefined}
        aria-controls={hasFeeders ? panelId : undefined}
        disabled={!hasFeeders}
        className={`w-full text-left px-4 py-3.5 min-w-0 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-black/15 ${
          hasFeeders ? "cursor-pointer hover:bg-black/[0.03]" : "cursor-default"
        }`}
      >
        <div className="flex items-start justify-between gap-3 mb-1.5 min-w-0">
          <p className="text-sm font-medium text-ink leading-snug min-w-0 flex-1 break-words">
            {program.name}
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className="font-mono text-sm font-bold tabular"
              style={{ color: program.pct !== null ? color : undefined }}
            >
              {formatPct(program.pct)}
            </span>
            {hasFeeders ? (
              <ChevronRight
                size={16}
                strokeWidth={2}
                aria-hidden
                className={`text-ink-tertiary transition-transform duration-200 ${
                  open ? "rotate-90" : ""
                }`}
                style={open ? { color: accent } : undefined}
              />
            ) : null}
          </div>
        </div>
        <div className="h-1.5 overflow-hidden mb-1.5" style={{ backgroundColor: track }}>
          <div
            className="h-full transition-all duration-500"
            style={{
              width:
                program.pct !== null
                  ? `${Math.min(Math.max(program.pct, 0), 1) * 100}%`
                  : "0%",
              backgroundColor: color,
            }}
          />
        </div>
        <div className="flex items-center justify-between gap-2 text-xs text-ink-tertiary tabular">
          <span>
            {formatCount(program.enrolled)} / {formatCount(program.seats)} seats
          </span>
          {hasFeeders ? (
            <span style={{ color: accent }} className="font-medium opacity-80">
              {program.feederCount} feeders
            </span>
          ) : null}
        </div>
      </button>

      {hasFeeders && open ? (
        <div
          id={panelId}
          className="px-4 pb-3.5 pt-0 border-t border-black/5 bg-black/[0.02]"
        >
          <div className="pt-2.5 flex items-center justify-between gap-2 mb-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-tertiary">
              Seats by feeder
            </p>
            <p className="text-[11px] text-ink-faint tabular">Enrolled / seats</p>
          </div>
          <ul className="space-y-1">
            {program.feeders.map((f) => {
              const fColor = f.pct !== null ? fillColor(f.pct) : "#94a3b8";
              return (
                <li
                  key={f.campus}
                  className="flex items-baseline justify-between gap-3 text-xs min-w-0 py-1"
                >
                  <span className="text-ink-secondary leading-snug min-w-0 break-words">
                    {f.campus}
                  </span>
                  <span className="shrink-0 tabular text-ink-tertiary text-right">
                    <span className="font-medium text-ink-secondary">
                      {formatCount(f.enrolled)}
                    </span>
                    {" / "}
                    <span className="font-semibold text-ink">
                      {formatCount(f.seats)}
                    </span>
                    <span
                      className="inline-block w-10 text-right font-mono font-semibold ml-2"
                      style={{ color: f.pct !== null ? fColor : undefined }}
                    >
                      {formatPct(f.pct)}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </li>
  );
}
