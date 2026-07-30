import { useEffect, useMemo, useState } from "react";
import {
  useIbcCampuses,
  fetchCombinedCampus,
} from "../hooks/useData";
import TierBadge, { TierDot, type TierKey } from "../components/TierBadge";

const KPI_TONES: {
  key: string;
  label: string;
  tone?: TierKey;
  cell: string;
  get: (ibc: any) => number;
}[] = [
  {
    key: "all",
    label: "All earned",
    cell: "bg-[#211650] text-white border-[#211650]",
    get: (ibc) => ibc.earned || 0,
  },
  {
    key: "t1",
    label: "Tier 1",
    tone: "t1",
    cell: "bg-[#dbeafe] text-[#1d4ed8] border-[#93c5fd]",
    get: (ibc) => ibc.t1_earned || 0,
  },
  {
    key: "t2",
    label: "Tier 2",
    tone: "t2",
    cell: "bg-[#ecfdf5] text-[#047857] border-heat-green/30",
    get: (ibc) => ibc.t2_earned || 0,
  },
  {
    key: "t3",
    label: "Tier 3",
    tone: "t3",
    cell: "bg-[#fffbeb] text-[#92400e] border-heat-amber/35",
    get: (ibc) => ibc.t3_earned || 0,
  },
  {
    key: "none",
    label: "No tier",
    tone: "none",
    cell: "bg-[#fef2f2] text-[#b91c1c] border-heat-red/30",
    get: (ibc) => ibc.none_earned || 0,
  },
];

export default function IbcCampuses() {
  const { data, loading, error } = useIbcCampuses();
  const [selected, setSelected] = useState("");
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const list = useMemo(() => {
    const rows = [...data];
    rows.sort((a, b) => a.display_name.localeCompare(b.display_name));
    return rows;
  }, [data]);

  useEffect(() => {
    if (!selected && list.length) {
      setSelected(list[0].campus_key);
    }
  }, [list, selected]);

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    setDetailLoading(true);
    setDetail(null);
    fetchCombinedCampus(selected)
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setDetail({ error: e instanceof Error ? e.message : "Failed" });
        }
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selected]);

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
            IBC Campuses
          </h1>
          <p className="text-base text-ink-secondary">{error}</p>
          <p className="text-sm text-ink-tertiary mt-2">
            Load IBC data from Overview → Refresh.
          </p>
        </div>
      </div>
    );
  }

  const ibc = detail?.ibc;
  const certs: any[] = ibc?.certs || [];
  const earnedCerts = certs.filter((c) => (c.earned || 0) > 0);

  return (
    <div className="h-full flex flex-col min-w-0 bg-surface">
      <div className="flex-1 overflow-y-auto min-w-0">
        <div className="px-8 md:px-12 lg:px-16 py-8 md:py-10 max-w-[1400px]">
          <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-ink tracking-tight">
                IBC Campuses
              </h1>
              <p className="text-base text-ink-secondary mt-1.5">
                Select a campus to see every IBC earned · color = TEA tier
              </p>
            </div>
            <label className="block min-w-[16rem]">
              <span className="text-sm font-medium text-ink-secondary block mb-1.5">
                Campus
              </span>
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="w-full h-10 px-3 text-sm border border-border bg-page shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:border-accent"
              >
                {list.map((c) => (
                  <option key={c.campus_key} value={c.campus_key}>
                    {c.display_name} ({c.earned} earned)
                  </option>
                ))}
              </select>
            </label>
          </header>

          <div className="flex flex-wrap gap-4 text-sm text-ink-secondary mb-6">
            <span className="inline-flex items-center gap-2">
              <TierDot tierKey="t1" /> Tier 1
            </span>
            <span className="inline-flex items-center gap-2">
              <TierDot tierKey="t2" /> Tier 2
            </span>
            <span className="inline-flex items-center gap-2">
              <TierDot tierKey="t3" /> Tier 3
            </span>
            <span className="inline-flex items-center gap-2">
              <TierDot tierKey="none" /> No tier
            </span>
          </div>

          {detailLoading && (
            <p className="text-base text-ink-tertiary py-12">Loading campus IBCs…</p>
          )}
          {detail?.error && (
            <p className="text-base text-heat-red">{detail.error}</p>
          )}

          {ibc && !detailLoading && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                {KPI_TONES.map((k) => (
                  <div
                    key={k.key}
                    className={`panel px-5 py-5 ${k.cell}`}
                  >
                    <p className="text-sm font-semibold opacity-90 mb-2">{k.label}</p>
                    <p className="font-mono text-3xl font-bold tabular leading-none">
                      {Number(k.get(ibc)).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <section className="pt-8 border-t border-border">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                  <h2 className="text-lg font-semibold text-ink tracking-tight">
                    IBCs earned at {ibc.display_name}
                  </h2>
                  <p className="text-sm text-ink-tertiary tabular">
                    {earnedCerts.length} certifications
                  </p>
                </div>

                <div className="panel bg-surface mb-8">
                  {earnedCerts.length === 0 ? (
                    <p className="px-5 py-8 text-base text-ink-tertiary">
                      No earned IBCs recorded for this campus in the weekly tracker.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[640px]">
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
                              Failed
                            </th>
                            <th className="px-4 py-3.5 text-xs font-semibold text-ink-secondary">
                              Pass rate
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {earnedCerts.map((cert) => (
                            <tr
                              key={cert.name}
                              className="border-b border-border/70 hover:bg-page/90"
                            >
                              <td className="px-5 py-3.5 text-base text-ink leading-snug">
                                {cert.name}
                                {cert.teachers?.length ? (
                                  <p className="text-sm text-ink-tertiary mt-1">
                                    {cert.teachers
                                      .map((t: any) => `${t.name} (${t.earned})`)
                                      .join(" · ")}
                                  </p>
                                ) : null}
                              </td>
                              <td className="px-4 py-3.5">
                                <TierBadge tier={cert.tier} tierKey={cert.tier_key} />
                              </td>
                              <td className="px-4 py-3.5 font-mono text-base font-semibold tabular">
                                {cert.earned}
                              </td>
                              <td className="px-4 py-3.5 font-mono text-base tabular text-ink-secondary">
                                {cert.failed ?? "—"}
                              </td>
                              <td className="px-4 py-3.5 font-mono text-base tabular text-ink-secondary">
                                {cert.pass_rate}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {detail.enrollment ? (
                  <section className="panel bg-surface p-6">
                    <h2 className="text-lg font-semibold text-ink tracking-tight mb-2">
                      9th-grade seat fill (latest snapshot)
                    </h2>
                    <p className="text-base text-ink-secondary">
                      <span className="font-semibold text-ink tabular">
                        {detail.enrollment.total_enrolled}
                      </span>{" "}
                      enrolled /{" "}
                      <span className="tabular">{detail.enrollment.total_seats}</span>{" "}
                      seats
                    </p>
                  </section>
                ) : null}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
