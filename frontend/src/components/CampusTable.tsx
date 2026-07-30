import { Fragment, memo, useId, useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import type { Campus } from "../hooks/useData";
import StatusBadge from "./StatusBadge";
import ProgramGroup, { splitPrograms } from "./ProgramGroup";
import {
  campusFill,
  campusHeatPct,
  formatCount,
  formatPct,
  worstProgram,
} from "../lib/format";
import { heatText } from "./FillBar";

interface Props {
  campuses: Campus[];
}

function CampusTable({ campuses }: Props) {
  return (
    <div className="panel bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-page/80">
              <th
                scope="col"
                className="px-5 py-3.5 text-xs font-semibold text-ink-secondary"
              >
                Campus
              </th>
              <th
                scope="col"
                className="px-4 py-3.5 text-xs font-semibold text-ink-secondary"
              >
                Fill
              </th>
              <th
                scope="col"
                className="px-4 py-3.5 text-xs font-semibold text-ink-secondary"
              >
                Seats
              </th>
              <th
                scope="col"
                className="px-4 py-3.5 text-xs font-semibold text-ink-secondary"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-4 py-3.5 text-xs font-semibold text-ink-secondary"
              >
                Worst program
              </th>
              <th scope="col" className="w-12 px-3">
                <span className="sr-only">Expand</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {campuses.map((c) => (
              <CampusTableRow key={c.campus} campus={c} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CampusTableRow({ campus }: { campus: Campus }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const pct = campusFill(campus);
  const heatPct = campusHeatPct(campus);
  const worst = useMemo(() => worstProgram(campus.programs), [campus.programs]);
  const { comp, ci } = useMemo(
    () => splitPrograms(campus.programs),
    [campus.programs]
  );

  return (
    <Fragment>
      <tr
        className={`border-b border-border transition-colors ${
          open ? "bg-accent-soft/40" : "hover:bg-page/90"
        }`}
      >
        <td className="px-5 py-4 align-middle">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={panelId}
            className="text-base font-semibold text-ink text-left leading-snug outline-none focus-visible:ring-2 focus-visible:ring-accent/35 rounded max-w-md"
          >
            {campus.campus}
          </button>
        </td>
        <td
          className={`px-4 py-4 align-middle font-mono text-base font-bold tabular ${
            heatPct !== null ? heatText(heatPct) : "text-ink-faint"
          }`}
        >
          {formatPct(pct)}
        </td>
        <td className="px-4 py-4 align-middle text-base text-ink-secondary tabular whitespace-nowrap">
          {pct !== null ? (
            <>
              {formatCount(campus.total_enrolled)}
              <span className="text-ink-tertiary">
                {" "}
                / {formatCount(campus.total_seats)}
              </span>
            </>
          ) : (
            <span className="text-ink-tertiary">—</span>
          )}
        </td>
        <td className="px-4 py-4 align-middle">
          <StatusBadge pct={heatPct} />
        </td>
        <td className="px-4 py-4 align-middle min-w-0 max-w-[16rem]">
          {worst ? (
            <span className="block leading-snug">
              <span className="text-sm text-ink-secondary" title={worst.name}>
                {worst.name}
              </span>
              <span
                className={`ml-2 font-mono text-sm font-semibold tabular ${heatText(worst.pct)}`}
              >
                {formatPct(worst.pct)}
              </span>
            </span>
          ) : (
            <span className="text-base text-ink-faint">—</span>
          )}
        </td>
        <td className="px-3 py-4 align-middle">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={open ? "Collapse programs" : "Expand programs"}
            className="p-1.5 rounded outline-none focus-visible:ring-2 focus-visible:ring-accent/35"
          >
            <ChevronRight
              size={18}
              strokeWidth={2}
              aria-hidden
              className={`text-ink-tertiary transition-transform duration-200 ${
                open ? "rotate-90 text-accent" : ""
              }`}
            />
          </button>
        </td>
      </tr>
      {open ? (
        <tr className="border-b border-border bg-page/50">
          <td colSpan={6} className="px-6 py-6" id={panelId}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl animate-in">
              {comp.length > 0 ? (
                <ProgramGroup label="Comprehensive" programs={comp} />
              ) : null}
              {ci.length > 0 ? (
                <ProgramGroup label="CI-feeding" programs={ci} />
              ) : null}
              {comp.length === 0 && ci.length === 0 ? (
                <p className="text-base text-ink-tertiary">No programs listed.</p>
              ) : null}
            </div>
          </td>
        </tr>
      ) : null}
    </Fragment>
  );
}

export default memo(CampusTable);
