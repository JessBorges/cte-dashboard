import type { Program } from "../hooks/useData";
import FillBar, { heatText } from "./FillBar";
import { formatCount, formatPct } from "../lib/format";

export default function ProgramGroup({
  label,
  programs,
}: {
  label: string;
  programs: Program[];
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-ink-secondary mb-3">{label}</p>
      <ul className="space-y-4">
        {programs.map((p) => {
          const ppct = p.seats && p.seats > 0 ? p.enrolled / p.seats : null;
          return (
            <li key={p.name} className="min-w-0">
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <span className="text-base text-ink leading-snug break-words min-w-0">
                  {p.name}
                </span>
                <span
                  className={`font-mono text-base font-semibold tabular shrink-0 ${
                    ppct !== null ? heatText(ppct) : "text-ink-faint"
                  }`}
                >
                  {formatPct(ppct)}
                </span>
              </div>
              <FillBar
                pct={ppct}
                seats={p.seats ?? 0}
                enrolled={p.enrolled}
                size="sm"
                showLabel={false}
              />
              <p className="text-sm text-ink-tertiary tabular mt-1.5">
                {formatCount(p.enrolled)}
                {p.seats != null ? ` / ${formatCount(p.seats)} seats` : " enrolled"}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function splitPrograms(programs: Program[]) {
  const comprehensive: Program[] = [];
  const feeding: Program[] = [];
  for (const p of programs) {
    if (p.is_ci_program) feeding.push(p);
    else comprehensive.push(p);
  }
  return { comp: comprehensive, ci: feeding };
}
