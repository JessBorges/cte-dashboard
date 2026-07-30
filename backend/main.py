"""FastAPI backend for CTE Data Dashboard (Enrollment + IBC)."""

from __future__ import annotations

import os
import shutil
from pathlib import Path

from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from database import init_db, save_snapshot, list_snapshots, get_snapshot, get_latest_snapshot, delete_snapshot
from processor import process_enrollment_file, detect_enrollment_format
from campus_norm import campus_key
import ibc_bridge

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"

ALLOWED_ORIGINS = os.environ.get(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
).split(",")

app = FastAPI(title="CTE Data Dashboard API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in ALLOWED_ORIGINS],
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()


@app.get("/api/snapshots")
def api_list_snapshots():
    return list_snapshots()


@app.get("/api/snapshots/latest")
def api_latest_snapshot():
    data = get_latest_snapshot()
    if not data:
        raise HTTPException(404, "No snapshots yet. Upload enrollment data first.")
    for c in data.get("campuses", []):
        c["campus_key"] = campus_key(c.get("campus", ""))
        c["display_name"] = c.get("campus", "")
    return data


@app.get("/api/snapshots/{snap_id}")
def api_get_snapshot(snap_id: int):
    data = get_snapshot(snap_id)
    if not data:
        raise HTTPException(404, "Snapshot not found")
    for c in data.get("campuses", []):
        c["campus_key"] = campus_key(c.get("campus", ""))
        c["display_name"] = c.get("campus", "")
    return data


@app.post("/api/upload")
async def api_upload(
    file: UploadFile = File(...),
    label: str = Form(""),
    date_label: str = Form("7/27"),
):
    if not file.filename or not file.filename.endswith(".xlsx"):
        raise HTTPException(400, "Please upload an .xlsx file")

    dest = UPLOAD_DIR / file.filename
    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)

    fmt = detect_enrollment_format(str(dest))
    unique = fmt == "catalog"
    if not label:
        label = (
            f"Week of {date_label} (unique G9)"
            if unique
            else f"Week of {date_label}"
        )

    try:
        campus_rows = process_enrollment_file(
            str(dest), date_label, unique_students=unique
        )
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(500, f"Failed to process file: {exc}") from exc

    snap_id = save_snapshot(label, date_label, file.filename, campus_rows)

    return {
        "snapshot_id": snap_id,
        "label": label,
        "campuses": len(campus_rows),
        "source_format": fmt,
        "unique_students": unique,
    }


@app.delete("/api/snapshots/{snap_id}")
def api_delete_snapshot(snap_id: int):
    delete_snapshot(snap_id)
    return {"ok": True}


@app.get("/api/ibc/status")
def api_ibc_status():
    return ibc_bridge.status()


@app.post("/api/ibc/refresh")
def api_ibc_refresh():
    out = ibc_bridge.refresh_mapping(force=True)
    if not out.get("ok"):
        raise HTTPException(503, out.get("error") or "IBC refresh failed")
    return out


@app.get("/api/ibc/summary")
def api_ibc_summary():
    return _ibc_or_503(ibc_bridge.summary)


@app.get("/api/ibc/campuses")
def api_ibc_campuses():
    return _ibc_or_503(ibc_bridge.campuses_list)


@app.get("/api/ibc/campuses/{key}")
def api_ibc_campus_detail(key: str):
    def _load():
        detail = ibc_bridge.campus_detail(key)
        if not detail:
            raise HTTPException(404, f"Campus not found: {key}")
        return detail
    return _ibc_or_503(_load)


@app.get("/api/ibc/pos")
def api_ibc_pos():
    return _ibc_or_503(ibc_bridge.pos_list)


@app.get("/api/ibc/certs")
def api_ibc_certs():
    return _ibc_or_503(ibc_bridge.certs_list)


@app.get("/api/campus/{key}/combined")
def api_campus_combined(key: str):
    enroll = get_latest_snapshot()
    enroll_campus = None
    if enroll:
        for c in enroll.get("campuses", []):
            if campus_key(c.get("campus", "")) == campus_key(key) or c.get("campus", "").lower() == key.lower():
                enroll_campus = c
                break

    ibc = None
    ibc_error = None
    try:
        ibc = ibc_bridge.campus_detail(key)
    except Exception as exc:
        ibc_error = str(exc)

    if not enroll_campus and not ibc:
        raise HTTPException(404, f"No enrollment or IBC data for campus: {key}")

    return {
        "campus_key": campus_key(key),
        "enrollment": enroll_campus,
        "enrollment_snapshot": enroll["snapshot"] if enroll else None,
        "ibc": ibc,
        "ibc_error": ibc_error,
    }


@app.post("/api/ibc/export-portfolio")
def api_ibc_export():
    return _ibc_or_503(ibc_bridge.export_portfolio)


def _ibc_or_503(fn):
    try:
        return fn()
    except Exception as exc:
        raise HTTPException(
            503,
            f"IBC data unavailable: {exc}. "
            "Ensure Public/IBC Tiers sources exist, then POST /api/ibc/refresh.",
        ) from exc


if FRONTEND_DIST.is_dir():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        file_path = FRONTEND_DIST / full_path
        if file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(FRONTEND_DIST / "index.html"))
