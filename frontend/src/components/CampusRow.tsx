import { memo, useId, useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import type { Campus } from "../hooks/useData";
import StatusBadge from "./StatusBadge";
import ProgramGroup, { splitPrograms } from "./ProgramGroup";
import {
  campusFill,
  campusHeatPct,
  fillColor,
  fillTrack,
  formatCount,
  formatPct,
} from "../lib/format";
import { heatText } from "./FillBar";

interface Props {
  campus: Campus;
  expandWide?: boolean;
}

/** CI feeder card — squared panel; border + shadow on the interactive box. */
function CampusRow({ campus, expandWide = true }: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const pct = campusFill(campus);
  const heatPct = campusHeatPct(campus);
  const statusColor = heatPct !== null ? fillColor(heatPct) : "#94a3b8";
  const track = fillTrack(heatPct);
  const fillWidth =
    pct !== null && campus.total_seats > 0
      ? `${Math.min(Math.max(pct, 0), 1) * 100}%`
      : "0%";

  const { comp, ci } = useMemo(
    () => splitPrograms(campus.programs),
    [campus.programs]
  );

  return (
    <article
      className={`min-w-0 ${
        open && expandWide ? "sm:col-span-2 xl:col-span-3" : ""
      }`}
    >
      <div className={`btn-box bg-page/60 ${open ? "is-active" : ""}`}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={panelId}
          className="w-full text-left px-6 py-6 outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-inset"
        >
          <div className="flex items-start justify-between gap-3 mb-5">
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-ink leading-snug mb-2.5 break-words">
                {campus.campus}
              </h2>
              <StatusBadge pct={heatPct} />
            </div>
            <ChevronRight
              size={20}
              strokeWidth={2}
              aria-hidden
              className={`text-ink-tertiary shrink-0 mt-0.5 transition-transform duration-200 ${
                open ? "rotate-90 text-accent" : ""
              }`}
            />
          </div>

          <div className="flex items-end justify-between gap-3 mb-4">
            <span
              className={`font-mono text-4xl font-bold tabular leading-none ${
                heatPct !== null ? heatText(heatPct) : "text-ink-faint"
              }`}
            >
              {formatPct(pct)}
            </span>
            <span className="text-sm text-ink-secondary tabular text-right leading-snug">
              {pct !== null ? (
                <>
                  <span className="font-semibold text-ink">
                    {formatCount(campus.total_enrolled)}
                  </span>
                  {" / "}
                  {formatCount(campus.total_seats)} seats
                </>
              ) : (
                "No seat target"
              )}
            </span>
          </div>

          <div
            className="h-2.5 overflow-hidden"
            style={{ backgroundColor: track }}
          >
            <div
              className="h-full transition-all duration-500"
              style={{
                width: fillWidth,
                backgroundColor: statusColor,
              }}
            />
          </div>
        </button>

        {open ? (
          <div
            id={panelId}
            className="border-t border-border px-6 pb-6 pt-5 space-y-5 animate-in"
          >
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
        ) : null}
      </div>
    </article>
  );
}

export default memo(CampusRow);
