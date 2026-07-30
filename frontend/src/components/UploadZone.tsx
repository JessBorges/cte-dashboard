import { useState, useRef, type DragEvent } from "react";
import { CheckCircle2, AlertCircle, CloudUpload } from "lucide-react";
import { uploadFile } from "../hooks/useData";

interface Props {
  onUploaded: () => void;
}

function defaultDateLabel() {
  const d = new Date();
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function UploadZone({ onUploaded }: Props) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [dateLabel, setDateLabel] = useState(defaultDateLabel);
  const [label, setLabel] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".xlsx")) {
      setResult({ ok: false, msg: "Please upload an .xlsx file" });
      return;
    }
    setUploading(true);
    setResult(null);
    try {
      const res = await uploadFile(file, label, dateLabel);
      const method = res.unique_students
        ? "unique Grade 9 students"
        : "EnrollmentByCourse seat counts";
      setResult({
        ok: true,
        msg: `${res.label} · ${res.campuses} campuses · ${method} · Snapshot #${res.snapshot_id}`,
      });
      setLabel("");
      onUploaded();
    } catch (e: unknown) {
      setResult({ ok: false, msg: (e as Error).message });
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end gap-5">
        <div>
          <label className="text-xs text-ink-tertiary font-medium block mb-2">
            Date Label
          </label>
          <input
            type="text"
            value={dateLabel}
            onChange={(e) => setDateLabel(e.target.value)}
            placeholder="e.g. 7/30"
            className="border border-border shadow-sm px-4 py-3 text-sm w-28 font-mono bg-page focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-all"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-ink-tertiary font-medium block mb-2">
            Label (optional)
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={`Week of ${dateLabel} (unique G9)`}
            className="border border-border shadow-sm px-4 py-3 text-sm w-full bg-page focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-all"
          />
        </div>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          btn-box border-2 border-dashed cursor-pointer
          flex flex-col items-center justify-center py-20
          ${
            dragging
              ? "border-accent bg-accent-soft"
              : "border-ink-faint/40 hover:border-accent/50 hover:bg-accent-soft/40 bg-surface"
          }
          ${uploading ? "opacity-50 pointer-events-none" : ""}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
        {uploading ? (
          <>
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mb-5" />
            <p className="text-sm text-ink-secondary font-medium">Processing…</p>
          </>
        ) : (
          <>
            <div className="w-14 h-14 bg-accent-soft border border-accent/20 flex items-center justify-center mb-5">
              <CloudUpload size={28} strokeWidth={1.4} className="text-accent" />
            </div>
            <p className="text-base text-ink font-semibold text-center px-4">
              Drop a student course catalog or EnrollmentByCourse file
            </p>
            <p className="text-sm text-ink-tertiary mt-1 text-center px-6">
              Prefer <span className="font-medium text-ink-secondary">CTE-CurrentCourseCatalog</span>{" "}
              (.xlsx) for unique-student fill · or click to browse
            </p>
          </>
        )}
      </div>

      {result && (
        <div
          className={`panel flex items-center gap-3 px-5 py-4 text-sm font-medium animate-in ${
            result.ok
              ? "bg-heat-green-soft text-heat-green border-heat-green/25"
              : "bg-heat-red-soft text-heat-red border-heat-red/25"
          }`}
        >
          {result.ok ? (
            <CheckCircle2 size={20} strokeWidth={1.6} />
          ) : (
            <AlertCircle size={20} strokeWidth={1.6} />
          )}
          {result.msg}
        </div>
      )}
    </div>
  );
}
