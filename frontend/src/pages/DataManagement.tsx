import { useSnapshots, deleteSnapshot, type Snapshot } from "../hooks/useData";
import UploadZone from "../components/UploadZone";
import {
  Trash2,
  FileSpreadsheet,
  Calendar,
  CheckCircle2,
  Info,
} from "lucide-react";

export default function DataManagement() {
  const { list, loading, refresh } = useSnapshots();

  const handleDelete = async (snap: Snapshot) => {
    if (!confirm(`Delete "${snap.label}"? This cannot be undone.`)) return;
    await deleteSnapshot(snap.id);
    refresh();
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-8 md:px-12 lg:px-16 py-8 md:py-10 space-y-8 md:space-y-10 min-w-0">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-ink tracking-tight">
            Data Management
          </h2>
          <p className="text-sm text-ink-tertiary mt-1">
            Upload weekly extracts to refresh fill rates (unique students preferred)
          </p>
        </div>

        {/* How it works */}
        <div className="panel flex items-start gap-3 px-5 py-4 bg-accent-soft border-accent/15">
          <Info size={18} strokeWidth={1.5} className="text-accent mt-0.5 shrink-0" />
          <div className="text-sm text-ink-secondary leading-relaxed space-y-2">
            <p>
              <span className="font-semibold text-ink">Preferred:</span>{" "}
              <code className="text-xs bg-white/70 px-1.5 py-0.5 font-mono border border-border">
                CTE-CurrentCourseCatalog
              </code>{" "}
              student×course extract. Detected automatically and counted as{" "}
              <span className="font-semibold text-ink">unique Grade 9 students</span>{" "}
              per L1 course (more accurate fill %).
            </p>
            <p>
              <span className="font-semibold text-ink">Also accepted:</span>{" "}
              <code className="text-xs bg-white/70 px-1.5 py-0.5 font-mono border border-border">
                EnrollmentByCourse
              </code>{" "}
              (legacy seat-sum). Seat goals still come from the CI / Comp seat workbook.
            </p>
          </div>
        </div>

        {/* Upload */}
        <UploadZone onUploaded={refresh} />

        {/* History */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-ink">Snapshots</h3>
            {list.length > 0 && (
              <span className="text-xs text-ink-tertiary font-mono tabular">
                {list.length} total
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : list.length === 0 ? (
            <div className="panel border-2 border-dashed border-ink-faint/30 py-16 text-center shadow-none">
              <FileSpreadsheet size={36} strokeWidth={1} className="text-ink-faint mx-auto mb-4" />
              <p className="text-sm text-ink-tertiary">No snapshots yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {list.map((snap, i) => (
                <div
                  key={snap.id}
                  className={`panel flex items-center gap-5 px-5 py-4 ${
                    i === 0
                      ? "bg-accent-soft/50 border-accent/15"
                      : "hover:border-border-hover"
                  }`}
                >
                  {i === 0 ? (
                    <CheckCircle2 size={22} strokeWidth={1.4} className="text-accent shrink-0" />
                  ) : (
                    <FileSpreadsheet size={20} strokeWidth={1.3} className="text-ink-faint shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-ink truncate">
                        {snap.label}
                      </span>
                      {i === 0 && (
                        <span className="text-[10px] font-bold text-accent bg-accent-soft px-2 py-0.5 border border-accent/20 uppercase tracking-wider">
                          Latest
                        </span>
                      )}
                      {(snap.label.toLowerCase().includes("unique") ||
                        (snap.filename || "")
                          .toLowerCase()
                          .includes("coursecatalog")) && (
                        <span className="text-[10px] font-bold text-ink-secondary bg-page px-2 py-0.5 border border-border uppercase tracking-wider">
                          Unique G9
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-ink-tertiary flex items-center gap-1.5 mt-1">
                      <Calendar size={11} />
                      {snap.created_at}
                      {snap.filename && (
                        <span className="font-mono text-[10px] text-ink-faint ml-1">
                          {snap.filename}
                        </span>
                      )}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(snap)}
                    className="btn-box p-2.5 text-ink-faint hover:bg-heat-red-soft hover:text-heat-red hover:border-heat-red/30"
                    title="Delete snapshot"
                  >
                    <Trash2 size={16} strokeWidth={1.4} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
