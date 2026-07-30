import { Fragment, useId, useState } from "react";
import { useIbcPos } from "../hooks/useData";
import { ChevronDown, ChevronRight } from "lucide-react";
import TierBadge from "../components/TierBadge";
import { formatCount } from "../lib/format";

function rateClass(pct: number) {
  if (pct >= 75) return "text-heat-green";
  if (pct >= 50) return "text-heat-amber";
  return "text-heat-red";
}

export default function IbcPrograms() {
  const { data, loading, error } = useIbcPos();
  const [open, setOpen] = useState<string | null>(null);

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
            Programs of Study
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
              Programs of Study
            </h1>
            <p className="text-base text-ink-secondary mt-1.5">
              Click a program to see individual IBCs earned · SY 2025–26 Eduthings
            </p>
          </header>

          <section className="pt-8 border-t border-border">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <h2 className="text-lg font-semibold text-ink tracking-tight">Programs</h2>
              <p className="text-sm text-ink-tertiary tabular">
                {formatCount(data.length)} shown
              </p>
            </div>

            <div className="panel bg-surface">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-page/80">
                      <th className="w-12 px-3 py-3.5" scope="col">
                        <span className="sr-only">Expand</span>
                      </th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-ink-secondary">
                        Program
                      </th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-ink-secondary">
                        Delivery
                      </th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-ink-secondary">
                        Attempts
                      </th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-ink-secondary">
                        Earned
                      </th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-ink-secondary">
                        Pass rate
                      </th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-ink-secondary">
                        T1?
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row) => (
                      <ProgramRow
                        key={row.name}
                        row={row}
                        open={open === row.name}
                        onToggle={() =>
                          setOpen((prev) => (prev === row.name ? null : row.name))
                        }
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function ProgramRow({
  row,
  open,
  onToggle,
}: {
  row: {
    name: string;
    delivery?: string;
    attempts?: number;
    earned?: number;
    pass_rate?: number;
    t1?: boolean;
    certs?: any[];
  };
  open: boolean;
  onToggle: () => void;
}) {
  const panelId = useId();
  const certs = row.certs || [];

  return (
    <Fragment>
      <tr
        className={`border-b border-border cursor-pointer transition-colors ${
          open ? "bg-accent-soft/50 border-b-transparent" : "hover:bg-page/90"
        }`}
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
      >
        <td className="px-3 py-4 align-middle">
          {open ? (
            <ChevronDown size={16} className="text-accent" aria-hidden />
          ) : (
            <ChevronRight size={16} className="text-ink-tertiary" aria-hidden />
          )}
        </td>
        <td className="px-4 py-4 text-base font-semibold text-ink align-middle">
          {row.name}
        </td>
        <td className="px-4 py-4 text-base text-ink-secondary align-middle">
          {row.delivery}
        </td>
        <td className="px-4 py-4 font-mono text-base tabular align-middle">
          {row.attempts || "—"}
        </td>
        <td className="px-4 py-4 font-mono text-base font-semibold tabular align-middle">
          {row.earned || "—"}
        </td>
        <td
          className={`px-4 py-4 font-mono text-base font-semibold tabular align-middle ${
            row.attempts ? rateClass(row.pass_rate || 0) : "text-ink-faint"
          }`}
        >
          {row.attempts ? `${row.pass_rate}%` : "—"}
        </td>
        <td
          className={`px-4 py-4 text-sm font-semibold align-middle ${
            row.t1 ? "text-[#1d4ed8]" : "text-ink-faint"
          }`}
        >
          {row.t1 ? "Yes" : "No"}
        </td>
      </tr>

      {open ? (
        <tr className="border-b border-border bg-page/70">
          <td colSpan={7} className="p-0" id={panelId}>
            {/* Nest under the Program column: skip chevron, indent with accent rail */}
            <div className="flex animate-in">
              <div className="w-12 shrink-0" aria-hidden />
              <div className="flex-1 min-w-0 border-l-2 border-accent/40 pl-4 pr-4 py-4 md:pr-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
                  <p className="text-sm font-semibold text-ink">
                    Certifications in this program
                  </p>
                  <p className="text-xs text-ink-tertiary tabular">
                    {certs.length === 0
                      ? "No cert attempts mapped"
                      : `${certs.length} certification${certs.length === 1 ? "" : "s"} · detail for ${row.name}`}
                  </p>
                </div>

                {certs.length === 0 ? (
                  <p className="text-sm text-ink-tertiary py-2">
                    No mapped cert attempts for this program in SY 2025–26.
                  </p>
                ) : (
                  <div className="panel bg-surface overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border bg-page/80">
                          <th className="px-4 py-2.5 text-xs font-semibold text-ink-secondary">
                            Certification
                          </th>
                          <th className="px-3 py-2.5 text-xs font-semibold text-ink-secondary w-[5.5rem]">
                            Tier
                          </th>
                          <th className="px-3 py-2.5 text-xs font-semibold text-ink-secondary w-24 text-right">
                            Attempts
                          </th>
                          <th className="px-3 py-2.5 text-xs font-semibold text-ink-secondary w-24 text-right">
                            Earned
                          </th>
                          <th className="px-3 py-2.5 text-xs font-semibold text-ink-secondary w-28 text-right">
                            Pass rate
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {certs.map((cert: any) => (
                          <tr
                            key={cert.name}
                            className="border-b border-border/70 last:border-b-0"
                          >
                            <td className="px-4 py-3 text-sm text-ink leading-snug">
                              {cert.name}
                            </td>
                            <td className="px-3 py-3 align-middle">
                              <TierBadge
                                tier={cert.tier}
                                tierKey={cert.tier_key}
                                compact
                              />
                            </td>
                            <td className="px-3 py-3 font-mono text-sm tabular text-right text-ink-secondary">
                              {cert.attempts ?? "—"}
                            </td>
                            <td className="px-3 py-3 font-mono text-sm font-semibold tabular text-right text-ink">
                              {cert.earned ?? "—"}
                            </td>
                            <td
                              className={`px-3 py-3 font-mono text-sm font-semibold tabular text-right ${
                                cert.attempts
                                  ? rateClass(cert.pass_rate || 0)
                                  : "text-ink-faint"
                              }`}
                            >
                              {cert.attempts ? `${cert.pass_rate}%` : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </Fragment>
  );
}
