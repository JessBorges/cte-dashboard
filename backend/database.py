"""Storage for CTE enrollment snapshots (SQLite local, PostgreSQL on Render)."""

from __future__ import annotations

import json
import os
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "cte_data.db"
DATABASE_URL = os.environ.get("DATABASE_URL")


def _conn():
    if DATABASE_URL:
        import psycopg2
        import psycopg2.extras

        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = False
        return conn
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def _execute(conn, sql, params=None):
    if DATABASE_URL:
        cur = conn.cursor()
        cur.execute(sql, params or ())
        return cur
    return conn.execute(sql, params or ())


def _fetchall(cur):
    if DATABASE_URL:
        return [dict(r) for r in cur.fetchall()]
    return [dict(r) for r in cur.fetchall()]


def _fetchone(cur):
    row = cur.fetchone()
    if row is None:
        return None
    return dict(row)


def _lastrowid(cur):
    if DATABASE_URL:
        cur.execute("SELECT LASTVAL()")
        return cur.fetchone()[0]
    return cur.lastrowid


def init_db():
    if DATABASE_URL:
        conn = _conn()
        _execute(conn, """
            CREATE TABLE IF NOT EXISTS snapshots (
                id          SERIAL PRIMARY KEY,
                label       TEXT NOT NULL,
                date_label  TEXT NOT NULL,
                created_at  TEXT DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS')),
                filename    TEXT
            )
        """)
        _execute(conn, """
            CREATE TABLE IF NOT EXISTS campus_data (
                id          SERIAL PRIMARY KEY,
                snapshot_id INTEGER NOT NULL REFERENCES snapshots(id) ON DELETE CASCADE,
                campus      TEXT NOT NULL,
                is_ci       INTEGER DEFAULT 0,
                total_seats REAL DEFAULT 0,
                total_enrolled INTEGER DEFAULT 0,
                data_json   TEXT NOT NULL
            )
        """)
        _execute(conn, """
            CREATE INDEX IF NOT EXISTS idx_campus_snap ON campus_data(snapshot_id)
        """)
        conn.commit()
        conn.close()
        return
    conn = _conn()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS snapshots (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            label       TEXT NOT NULL,
            date_label  TEXT NOT NULL,
            created_at  TEXT DEFAULT (datetime('now','localtime')),
            filename    TEXT
        );
        CREATE TABLE IF NOT EXISTS campus_data (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            snapshot_id INTEGER NOT NULL REFERENCES snapshots(id) ON DELETE CASCADE,
            campus      TEXT NOT NULL,
            is_ci       INTEGER DEFAULT 0,
            total_seats REAL DEFAULT 0,
            total_enrolled INTEGER DEFAULT 0,
            data_json   TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_campus_snap ON campus_data(snapshot_id);
    """)
    conn.close()


def save_snapshot(label: str, date_label: str, filename: str,
                  campus_rows: list[dict]) -> int:
    conn = _conn()
    cur = _execute(conn,
        "INSERT INTO snapshots (label, date_label, filename) VALUES (%s,%s,%s)" if DATABASE_URL
        else "INSERT INTO snapshots (label, date_label, filename) VALUES (?,?,?)",
        (label, date_label, filename),
    )
    snap_id = _lastrowid(cur)

    for row in campus_rows:
        payload = {"programs": row.get("programs", [])}
        if row.get("feeders") is not None:
            payload["feeders"] = row["feeders"]
        _execute(conn,
            """INSERT INTO campus_data
               (snapshot_id, campus, is_ci, total_seats, total_enrolled, data_json)
               VALUES (%s,%s,%s,%s,%s,%s)""" if DATABASE_URL
            else """INSERT INTO campus_data
               (snapshot_id, campus, is_ci, total_seats, total_enrolled, data_json)
               VALUES (?,?,?,?,?,?)""",
            (snap_id, row["campus"], int(row["is_ci"]),
             row["total_seats"], row["total_enrolled"],
             json.dumps(payload)),
        )
    conn.commit()
    conn.close()
    return snap_id


def list_snapshots() -> list[dict]:
    conn = _conn()
    cur = _execute(conn,
        "SELECT id, label, date_label, created_at, filename FROM snapshots ORDER BY id DESC")
    rows = _fetchall(cur)
    conn.close()
    return rows


def get_snapshot(snap_id: int) -> dict | None:
    conn = _conn()
    cur = _execute(conn,
        "SELECT id, label, date_label, created_at FROM snapshots WHERE id=%s" if DATABASE_URL
        else "SELECT id, label, date_label, created_at FROM snapshots WHERE id=?",
        (snap_id,),
    )
    snap = _fetchone(cur)
    if not snap:
        conn.close()
        return None

    cur = _execute(conn,
        "SELECT campus, is_ci, total_seats, total_enrolled, data_json FROM campus_data WHERE snapshot_id=%s" if DATABASE_URL
        else "SELECT campus, is_ci, total_seats, total_enrolled, data_json FROM campus_data WHERE snapshot_id=?",
        (snap_id,),
    )
    rows = _fetchall(cur)
    conn.close()

    campuses = []
    for r in rows:
        d = dict(r)
        raw = json.loads(d["data_json"])
        if isinstance(raw, list):
            d["programs"] = raw
        else:
            d["programs"] = raw.get("programs", [])
            if "feeders" in raw:
                d["feeders"] = raw["feeders"]
        del d["data_json"]
        campuses.append(d)

    return {"snapshot": dict(snap), "campuses": campuses}


def get_latest_snapshot() -> dict | None:
    conn = _conn()
    cur = _execute(conn, "SELECT id FROM snapshots ORDER BY id DESC LIMIT 1")
    snap = _fetchone(cur)
    conn.close()
    if not snap:
        return None
    return get_snapshot(snap["id"])


def delete_snapshot(snap_id: int):
    conn = _conn()
    _execute(conn,
        "DELETE FROM campus_data WHERE snapshot_id=%s" if DATABASE_URL
        else "DELETE FROM campus_data WHERE snapshot_id=?",
        (snap_id,),
    )
    _execute(conn,
        "DELETE FROM snapshots WHERE id=%s" if DATABASE_URL
        else "DELETE FROM snapshots WHERE id=?",
        (snap_id,),
    )
    conn.commit()
    conn.close()
