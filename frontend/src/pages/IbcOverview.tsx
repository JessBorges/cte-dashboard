import { useMemo, useState } from "react";
import {
  useIbcSummary,
  refreshIbc,
  exportIbcPortfolio,
} from "../hooks/useData";
import { RefreshCw, FileDown, AlertTriangle, ChevronDown } from "lucide-react";
import TierBadge, { type TierKey } from "../components/TierBadge";
import TierBarChart from "../components/TierBarChart";

type PanelKey = "all" | TierKey;

export default function IbcOverview() {
  const { data, loading, error, refresh } = useIbcSummary();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [openPanel, setOpenPanel] = useState<PanelKey | null>("all");

  const onRefresh = async () => {
    setBusy("refresh");
    setMsg(null);
    try {
      const r = await refreshIbc();
      setMsg(`IBC data rebuilt at ${r.built_at}`);
      await refresh();
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Refresh failed");
    } finally {
      setBusy(null);
    }
  };

  const onExport = async () => {
    setBusy("export");
    setMsg(null);
    try {
      await exportIbcPortfolio();
      window.open("/api/ibc/export-portfolio/download?which=portfolio", "_blank");
      setMsg("Portfolio PDF generated — download started.");
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Export failed");
    } finally {
      setBusy(null);
    }
  };

  const w = data?.weekly && !data.weekly.error ? data.weekly : null;

  const panels = useMemo(() => {
    if (!w) return [];
    return [
      {
        key: "all" as PanelKey,
        label: "Total earned",
        value: w.earned || 0,
        cell: "bg-[#211650] text-white border-[#211650]",
      },
      {
        key: "t1" as PanelKey,
        label: "Tier 1",
        value: w.t1 || 0,
        cell: "bg-[#dbeafe] text-[#1d4ed8] border-[#93c5fd]",
      },
      {
        key: "t2" as PanelKey,
        label: "Tier 2",
        value: w.t2 || 0,
        cell: "bg-[#ecfdf5] text-[#047857] border-heat-green/30",
      },
      {
        key: "t3" as PanelKey,
        label: "Tier 3",
        value: w.t3 || 0,
        cell: "bg-[#fffbeb] text-[#92400e] border-heat-amber/35",
      },
      {
        key: "none" as PanelKey,
        label: "No tier",
        value: w.none || 0,
        cell: "bg-[#fef2f2] text-[#b91c1c] border-heat-red/30",
      },
    ];
  }, [w]);

  const chartValues = useMemo(
    () =>
      (["t1", "t2", "t3", "none"] as TierKey[]).map((key) => ({
        key,
        value: (w?.[key] as number) || 0,
      })),
    [w]
  );

  const openCerts = useMemo(() => {
    if (!w?.certs_by_tier || !openPanel) return [];
    const key = openPanel === "all" ? "all" : openPanel;
    return w.certs_by_tier[key] || [];
  }, [w, openPanel]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-surface">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="h-full overflow-y-auto bg-surface">
        <div className="px-8 md:px-12 lg:px-16 py-8 md:py-10 max-w-[1400px]">
          <h1 className="text-3xl md:text-4xl font-bold text-ink tracking-tight mb-2">
            IBC Overview
          </h1>
          <div className="panel mt-6 border-heat-amber/30 bg-heat-amber-soft p-5 max-w-xl">
            <div className="flex gap-3 items-start">
              <AlertTriangle className="text-heat-amber shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-semibold text-ink mb-1">IBC data not loaded</p>
                <p className="text-sm text-ink-secondary mb-4">
                  {error || "Build the mapping from Public/IBC Tiers sources."}
                </p>
                <button
                  type="button"
                  onClick={onRefresh}
                  disabled={!!busy}
                  className="btn-box inline-flex items-center gap-2 px-4 py-2 bg-primary text-white border-primary text-sm font-medium hover:bg-primary-hover disabled:opacity-50"
                >
                  <RefreshCw size={16} className={busy === "refresh" ? "animate-spin" : ""} />
                  Load IBC data
                </button>
                {msg && <p className="mt-3 text-xs text-ink-tertiary">{msg}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const c = data.completer;
  const btnBase =
    "btn-box inline-flex items-center gap-2 px-3 py-2 text-sm font-medium disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-accent/40";

  const togglePanel = (key: PanelKey) => {
    setOpenPanel((prev) => (prev === key ? null : key));
  };

  return (
    <div className="h-full flex flex-col min-w-0 bg-surface">
      <div className="flex-1 overflow-y-auto min-w-0">
        <div className="px-8 md:px-12 lg:px-16 py-8 md:py-10 max-w-[1400px]">
          <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-3xl md:text-4xl font-bold text-ink tracking-tight">
                IBC Overview
              </h1>
              <p className="text-base text-ink-secondary mt-1.5">
                Weekly tracker earns + TEA tiers · Built {data.built_at || "—"}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={onRefresh}
                disabled={!!busy}
                className={`${btnBase} bg-surface text-ink`}
              >
                <RefreshCw
                  size={15}
                  className={busy === "refresh" ? "animate-spin" : ""}
                  aria-hidden
                />
                Refresh
              </button>
              <button
                type="button"
                onClick={onExport}
                disabled={!!busy}
                className={`${btnBase} bg-accent text-white border-accent hover:bg-accent-hover`}
              >
                <FileDown size={15} aria-hidden />
                {busy === "export" ? "Building PDF…" : "Export PDF portfolio"}
              </button>
            </div>
          </header>

          {msg ? (
            <div
              className="panel mb-6 text-sm text-ink-secondary bg-accent-soft px-4 py-3"
              role="status"
            >
              {msg}
            </div>
          ) : null}

          {w ? (
            <>
              <section className="mb-10">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  {panels.map((p) => {
                    const active = openPanel === p.key;
                    return (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => togglePanel(p.key)}
                        aria-expanded={active}
                        className={`btn-box text-left px-5 py-5 outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${p.cell} ${
                          active ? "is-active" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <p className="text-sm font-semibold opacity-90">{p.label}</p>
                          <ChevronDown
                            size={16}
                            className={`opacity-70 transition-transform ${active ? "rotate-180" : ""}`}
                            aria-hidden
                          />
                        </div>
                        <p className="font-mono text-3xl font-bold tabular leading-none">
                          {p.value.toLocaleString()}
                        </p>
                        <p className="text-xs mt-2 opacity-75">
                          {active ? "Hide list" : "Click for IBCs"}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {openPanel ? (
                  <div className="panel bg-surface px-5 py-5 animate-in">
                    <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
                      <h2 className="text-lg font-semibold text-ink tracking-tight">
                        {openPanel === "all"
                          ? "All IBCs earned (YTD)"
                          : `${panels.find((p) => p.key === openPanel)?.label} certifications earned`}
                      </h2>
                      <p className="text-sm text-ink-tertiary tabular">
                        {openCerts.length} certifications ·{" "}
                        {openCerts
                          .reduce((s, cert) => s + cert.earned, 0)
                          .toLocaleString()}{" "}
                        earns
                      </p>
                    </div>
                    <div className="panel bg-page max-h-80 overflow-y-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-page/95">
                          <tr className="border-b border-border">
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
                              G12
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {openCerts.map((cert) => (
                            <tr key={cert.name} className="border-b border-border/70">
                              <td className="px-5 py-3.5 text-base text-ink">
                                {cert.name}
                              </td>
                              <td className="px-4 py-3.5">
                                <TierBadge
                                  tier={cert.tier}
                                  tierKey={cert.tier_key}
                                  compact
                                />
                              </td>
                              <td className="px-4 py-3.5 font-mono text-base font-semibold tabular">
                                {cert.earned.toLocaleString()}
                              </td>
                              <td className="px-4 py-3.5 font-mono text-base tabular text-ink-secondary">
                                {(cert.g12 ?? 0).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}
                <p className="text-sm text-ink-tertiary mt-3">
                  {w.campus_count} campuses · {w.cert_count} certifications · {w.title}
                </p>
              </section>

              <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 mb-10">
                <section className="panel bg-surface p-6">
                  <h2 className="text-lg font-semibold text-ink tracking-tight mb-4">
                    Earns by tier
                  </h2>
                  <TierBarChart
                    values={chartValues}
                    active={openPanel === "all" ? null : openPanel}
                    onSelect={(key) => setOpenPanel(key)}
                  />
                </section>

                <section className="panel bg-surface p-6">
                  <h2 className="text-lg font-semibold text-ink tracking-tight mb-3">
                    Senior Completer IBC gap (SY 2025–26)
                  </h2>
                  <p className="font-mono text-3xl font-bold text-heat-red tabular leading-none">
                    {c.failure_rate}%
                  </p>
                  <p className="text-sm text-ink-secondary mt-2 mb-4">
                    of PEIMS G12 Completers (Code 7) with no current-year earned IBC
                  </p>
                  <ul className="text-base text-ink-secondary space-y-1.5 mb-4">
                    <li>
                      <span className="font-semibold text-ink tabular">
                        {c.g12_completers.toLocaleString()}
                      </span>{" "}
                      Completers (Code 7)
                    </li>
                    <li>
                      <span className="font-semibold text-ink tabular">
                        {c.earned.toLocaleString()}
                      </span>{" "}
                      earned (Final Submission / state roster join)
                    </li>
                    <li>
                      <span className="font-semibold text-ink tabular">
                        {c.no_attempt.toLocaleString()}
                      </span>{" "}
                      never tested (current year)
                    </li>
                  </ul>
                  <div className="panel bg-page px-4 py-3 text-sm text-ink-secondary leading-relaxed">
                    <p className="font-medium text-ink mb-1">
                      Why this looks low vs the tracker
                    </p>
                    <p>
                      Weekly tracker shows{" "}
                      <span className="font-semibold text-ink tabular">
                        {(c.weekly_g12_cert_earns ?? w.g12_earned ?? 0).toLocaleString()}
                      </span>{" "}
                      Grade 12 cert earns (any senior, cert-level). The Completer gap only
                      counts unique Code 7 Completers joined to current-year PEIMS/Final
                      Submission — not prior-year earns and not non-Completer seniors.
                    </p>
                  </div>
                </section>
              </div>
            </>
          ) : (
            <div className="panel mb-10 border-heat-amber/30 bg-heat-amber-soft p-4 text-sm text-ink-secondary">
              Weekly tracker not loaded. Place the IBC Tracker Weekly Report in Resources/
              and hit Refresh.
              {data.weekly?.error ? ` (${data.weekly.error})` : ""}
            </div>
          )}

          <section className="pt-8 border-t border-border">
            <div className="panel bg-surface p-6">
              <h2 className="text-lg font-semibold text-ink tracking-tight mb-4">
                3-year earns (mapping)
              </h2>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-page/80">
                    <th className="px-4 py-3.5 text-xs font-semibold text-ink-secondary">
                      Year
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold text-ink-secondary">
                      All
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold text-[#1d4ed8]">
                      T1
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold text-[#047857]">
                      T2
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold text-[#92400e]">
                      T3
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.years.map((y) => (
                    <tr key={y.year} className="border-b border-border/70">
                      <td className="px-4 py-3.5 text-base text-ink">{y.year}</td>
                      <td className="px-4 py-3.5 font-mono text-base tabular">
                        {y.all.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-base tabular text-[#1d4ed8] font-medium">
                        {y.t1}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-base tabular text-[#047857]">
                        {y.t2.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-base tabular text-[#92400e]">
                        {y.t3.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-4 text-sm text-ink-tertiary leading-relaxed">{data.note}</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
