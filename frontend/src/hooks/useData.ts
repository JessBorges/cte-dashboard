import { useState, useEffect, useCallback } from "react";

const API = "/api";

export interface Program {
  name: string;
  courses: number[];
  seats: number | null;
  enrolled: number;
  pct: number | null;
  is_ci_program: boolean;
}

export interface FeederCampus {
  campus: string;
  total_seats: number;
  total_enrolled: number;
  programs: Program[];
}

export interface Campus {
  campus: string;
  campus_key?: string;
  display_name?: string;
  is_ci: number;
  total_seats: number;
  total_enrolled: number;
  programs: Program[];
  feeders?: FeederCampus[];
}

export interface Snapshot {
  id: number;
  label: string;
  date_label: string;
  created_at: string;
  filename?: string;
}

export interface SnapshotData {
  snapshot: Snapshot;
  campuses: Campus[];
}

export interface IbcCertRow {
  name: string;
  earned: number;
  tier: string;
  tier_key: string;
  projected?: number;
  g12?: number;
}

export interface IbcWeeklyBlock {
  title?: string;
  source?: string;
  built_at?: string;
  earned?: number;
  projected?: number;
  t1?: number;
  t2?: number;
  t3?: number;
  none?: number;
  g12_earned?: number;
  cert_count?: number;
  campus_count?: number;
  top_certs?: IbcCertRow[];
  certs_by_tier?: Record<string, IbcCertRow[]>;
  error?: string;
}

export interface IbcSummary {
  built_at: string | null;
  all_earns_3yr: number;
  tier1_3yr: number;
  pos_offered: number;
  pos_t1_eligible: number;
  years: { year: string; all: number; t1: number; t2: number; t3: number }[];
  weekly?: IbcWeeklyBlock | null;
  completer: {
    g12_completers: number;
    earned: number;
    no_cert: number;
    failure_rate: number;
    no_attempt: number;
    tester_fail_rate: number;
    g12_cte_total: number;
    g12_code7: number;
    g9_cte_total: number;
    g9_total_enrollment: number;
    weekly_g12_cert_earns?: number;
    method?: string;
  };
  note: string;
}

export interface IbcCampusRow {
  campus_key: string;
  display_name: string;
  attempts: number;
  earned: number;
  pass_rate: number;
  t1_earned: number;
  t2_earned?: number;
  t3_earned?: number;
  none_earned?: number;
  t1_attempts: number;
  all_earned?: number;
  source?: string;
}

export function useSnapshots() {
  const [list, setList] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`${API}/snapshots`);
    const data = await res.json();
    setList(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { list, loading, refresh };
}

export function useSnapshotData(id: number | "latest") {
  const [data, setData] = useState<SnapshotData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${API}/snapshots/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("No data available");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  return { data, loading, error };
}

export function useIbcSummary() {
  const [data, setData] = useState<IbcSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/ibc/summary`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "IBC summary unavailable");
      }
      setData(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);
  return { data, loading, error, refresh };
}

export function useIbcCampuses() {
  const [data, setData] = useState<IbcCampusRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/ibc/campuses`)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).detail || "Failed");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

export function useIbcPos() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/ibc/pos`)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).detail || "Failed");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

export function useIbcCerts() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/ibc/certs`)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).detail || "Failed");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

export async function fetchCombinedCampus(key: string) {
  const res = await fetch(`${API}/campus/${encodeURIComponent(key)}/combined`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Combined campus load failed");
  }
  return res.json();
}

export async function refreshIbc(): Promise<{ built_at: string }> {
  const res = await fetch(`${API}/ibc/refresh`, { method: "POST" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "IBC refresh failed");
  }
  return res.json();
}

export async function exportIbcPortfolio(): Promise<{ portfolio: string }> {
  const res = await fetch(`${API}/ibc/export-portfolio`, { method: "POST" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Export failed");
  }
  return res.json();
}

export async function uploadFile(
  file: File,
  label: string,
  dateLabel: string
): Promise<{
  snapshot_id: number;
  campuses: number;
  label: string;
  source_format?: "catalog" | "by_course";
  unique_students?: boolean;
}> {
  const form = new FormData();
  form.append("file", file);
  form.append("label", label);
  form.append("date_label", dateLabel);

  const res = await fetch(`${API}/upload`, { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Upload failed");
  }
  return res.json();
}

export async function deleteSnapshot(id: number): Promise<void> {
  await fetch(`${API}/snapshots/${id}`, { method: "DELETE" });
}
