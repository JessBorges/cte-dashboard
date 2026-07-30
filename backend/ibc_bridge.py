"""Bridge Enrollment Data API ↔ IBC Tiers MappingResult / PDF portfolio."""

from __future__ import annotations

import os
import sys
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from campus_norm import campus_key

_IBC_DATA = Path(os.environ.get("IBC_DATA_DIR", "")) if os.environ.get("IBC_DATA_DIR") else None
IBC_ROOT = (
    _IBC_DATA
    if _IBC_DATA and _IBC_DATA.is_dir()
    else Path(__file__).resolve().parents[3] / "IBC Tiers"
)
if str(IBC_ROOT) not in sys.path:
    sys.path.insert(0, str(IBC_ROOT))

_cache: Dict[str, Any] = {
    "result": None,
    "cert_research": None,
    "built_at": None,
    "error": None,
}

TIERED = {"Tier 1", "Tier 2", "Tier 3"}


def _tier_key(tier: str) -> str:
    t = (tier or "").strip()
    if t == "Tier 1":
        return "t1"
    if t == "Tier 2":
        return "t2"
    if t == "Tier 3":
        return "t3"
    return "none"


def _pct(n: float, d: float, digits: int = 1) -> float:
    if not d:
        return 0.0
    return round(100.0 * float(n) / float(d), digits)


def refresh_mapping(force: bool = True) -> Dict[str, Any]:
    """Build (or rebuild) MappingResult. Slow — cache afterward."""
    global _cache
    try:
        from build_tier1_pos_mapping import (  # noqa: WPS433
            GENERATED,
            PLAN_YEAR,
            SY_2324,
            SY_LABEL,
            SY_PRIOR,
            _build_cert_research,
            build_mapping,
        )

        result = build_mapping()
        research = _build_cert_research(result)
        weekly_info: Dict[str, Any] = {"ok": False}
        try:
            import ibc_weekly  # noqa: WPS433

            weekly = ibc_weekly.load_weekly(force=True)
            weekly_info = {
                "ok": True,
                "source": weekly.get("source"),
                "earned": weekly["district"]["earned"],
            }
        except Exception as wexc:  # noqa: BLE001
            weekly_info = {"ok": False, "error": str(wexc)}

        _cache = {
            "result": result,
            "cert_research": research,
            "built_at": datetime.now().isoformat(timespec="seconds"),
            "error": None,
            "meta": {
                "SY_2324": SY_2324,
                "SY_PRIOR": SY_PRIOR,
                "SY_LABEL": SY_LABEL,
                "PLAN_YEAR": PLAN_YEAR,
                "GENERATED": GENERATED,
            },
            "weekly": weekly_info,
        }
        return {
            "ok": True,
            "built_at": _cache["built_at"],
            "weekly": weekly_info,
        }
    except Exception as exc:  # noqa: BLE001 — surface to API
        _cache["error"] = str(exc)
        _cache["result"] = None
        return {"ok": False, "error": str(exc)}


def get_result():
    if _cache["result"] is None:
        refresh_mapping()
    if _cache["result"] is None:
        raise RuntimeError(_cache.get("error") or "IBC mapping unavailable")
    return _cache["result"]


def status() -> Dict[str, Any]:
    try:
        import ibc_weekly  # noqa: WPS433

        weekly = ibc_weekly.weekly_status()
    except Exception as exc:  # noqa: BLE001
        weekly = {"error": str(exc)}
    return {
        "ready": _cache["result"] is not None,
        "built_at": _cache.get("built_at"),
        "error": _cache.get("error"),
        "ibc_root": str(IBC_ROOT),
        "weekly": weekly,
    }


def _agg_by_campus(attempt_rows: List[dict], cn: Dict[str, str]) -> Dict[str, dict]:
    camps: Dict[str, dict] = defaultdict(lambda: {
        "attempts": 0, "earned": 0,
        "by_cert": Counter(), "earned_by_cert": Counter(),
        "cert_tier": {},
        "teachers": defaultdict(lambda: {"attempts": 0, "earned": 0}),
        "t1_earned": 0, "t1_attempts": 0,
        "display_name": "",
    })
    for r in attempt_rows:
        raw = (r.get("campus") or "").strip()
        if not raw:
            continue
        key = campus_key(cn.get(raw, raw))
        d = camps[key]
        d["display_name"] = key
        d["attempts"] += 1
        is_earned = r.get("earned") == "1"
        if is_earned:
            d["earned"] += 1
        cert_key = f"{r.get('cert_code')}: {r.get('certification_name')}"
        tier = r.get("tier", "Unknown")
        d["by_cert"][cert_key] += 1
        d["cert_tier"][cert_key] = tier
        if is_earned:
            d["earned_by_cert"][cert_key] += 1
        if tier == "Tier 1":
            d["t1_attempts"] += 1
            if is_earned:
                d["t1_earned"] += 1
        tname = (r.get("teacher_name") or "").strip()
        if tname:
            d["teachers"][tname]["attempts"] += 1
            if is_earned:
                d["teachers"][tname]["earned"] += 1
    return dict(camps)


def _agg_by_cert(attempt_rows: List[dict], cn: Dict[str, str]) -> Dict[str, dict]:
    certs: Dict[str, dict] = defaultdict(lambda: {
        "name": "", "tier": "", "attempts": 0, "earned": 0,
        "by_campus": Counter(), "earned_by_campus": Counter(),
        "teachers": defaultdict(lambda: {"attempts": 0, "earned": 0}),
    })
    for r in attempt_rows:
        code = r.get("cert_code") or ""
        if not code:
            continue
        d = certs[code]
        d["name"] = r.get("certification_name") or ""
        d["tier"] = r.get("tier", "")
        d["attempts"] += 1
        is_earned = r.get("earned") == "1"
        if is_earned:
            d["earned"] += 1
        camp = campus_key(cn.get(r.get("campus") or "", r.get("campus") or ""))
        d["by_campus"][camp] += 1
        if is_earned:
            d["earned_by_campus"][camp] += 1
        tname = (r.get("teacher_name") or "").strip()
        if tname:
            d["teachers"][tname]["attempts"] += 1
            if is_earned:
                d["teachers"][tname]["earned"] += 1
    return dict(certs)


def summary() -> Dict[str, Any]:
    result = get_result()
    cs = result.completer_stats or {}
    years = []
    for yr in (result.all_earns_by_year or {}):
        tc = result.all_earns_by_year_tier.get(yr, Counter())
        years.append({
            "year": yr,
            "all": result.all_earns_by_year.get(yr, 0),
            "t1": tc.get("Tier 1", 0),
            "t2": tc.get("Tier 2", 0),
            "t3": tc.get("Tier 3", 0),
        })
    active = result.active_offerings()
    active_t1 = [o for o in active if result.offering_tier1_eligible(o)]
    all_total = sum(result.all_earns_by_year.values())
    t1_total = sum(sum(c.values()) for c in result.hist_by_year_cert.values())
    weekly_block: Optional[Dict[str, Any]] = None
    weekly_g12_earned = 0
    try:
        import ibc_weekly  # noqa: WPS433

        weekly = ibc_weekly.load_weekly()
        certs = weekly["cert_totals"]
        weekly_g12_earned = sum(int(c.get("g12") or 0) for c in certs)
        by_tier: Dict[str, List[dict]] = {"t1": [], "t2": [], "t3": [], "none": [], "all": []}
        for c in certs:
            row = {
                "name": c["name"],
                "earned": c["earned"],
                "projected": c.get("projected", 0),
                "g12": c.get("g12", 0),
                "tier": c["tier"],
                "tier_key": c["tier_key"],
            }
            by_tier[c["tier_key"]].append(row)
            by_tier["all"].append(row)
        weekly_block = {
            "title": weekly.get("title"),
            "source": weekly.get("source"),
            "built_at": weekly.get("built_at"),
            **weekly["district"],
            "g12_earned": weekly_g12_earned,
            "top_certs": certs[:20],
            "certs_by_tier": by_tier,
        }
    except Exception as exc:  # noqa: BLE001
        weekly_block = {"error": str(exc)}

    return {
        "built_at": _cache.get("built_at"),
        "all_earns_3yr": all_total,
        "tier1_3yr": t1_total,
        "pos_offered": len(active),
        "pos_t1_eligible": len(active_t1),
        "years": years,
        "weekly": weekly_block,
        "completer": {
            "g12_completers": cs.get("g12_completers", 0),
            "earned": cs.get("earned", 0),
            "no_cert": cs.get("no_cert", 0),
            "failure_rate": cs.get("failure_rate", 0),
            "no_attempt": cs.get("no_attempt", 0),
            "tester_fail_rate": cs.get("tester_fail_rate", 0),
            "g12_cte_total": cs.get("g12_cte_total", 0),
            "g12_code7": cs.get("g12_code7", 0),
            "g9_cte_total": cs.get("g9_cte_total", 0),
            "g9_total_enrollment": cs.get("g9_total_enrollment", 9700),
            # Parallel signal from weekly tracker (cert-level G12 earns, not unique Completers)
            "weekly_g12_cert_earns": weekly_g12_earned,
            "method": (
                "PEIMS Completer gap: G12 CTE Code 7 on TEA roster 404-002, joined to "
                "current-year Final Submission / state IBC roster (E1733=01). "
                "Does not count prior-year earns. Weekly tracker G12 column is cert-level "
                "earns for any senior, not Completer-only unique students."
            ),
        },
        "note": (
            "G12 CTE code distribution is a cross-section (highest code per senior), "
            "not multi-year cohort attrition. Weekly tracker totals are current-year "
            "all IBCs earned (tiered + non-tiered) from the IBC Tracker Weekly Report."
        ),
    }


def campuses_list() -> List[Dict[str, Any]]:
    """Prefer weekly CCMR campus rollup (all IBCs); fall back to Eduthings mapping."""
    try:
        import ibc_weekly  # noqa: WPS433

        weekly = ibc_weekly.load_weekly()
        out = []
        for row in weekly["campuses"]:
            att = sum(c["attempts"] for c in row["certs"])
            earn = row["earned"]
            out.append({
                "campus_key": row["campus_key"],
                "display_name": row["display_name"],
                "attempts": att,
                "earned": earn,
                "pass_rate": _pct(earn, att) if att else row.get("success_rate", 0),
                "t1_earned": row.get("t1_earned", 0),
                "t2_earned": row.get("t2_earned", 0),
                "t3_earned": row.get("t3_earned", 0),
                "none_earned": row.get("none_earned", 0),
                "t1_attempts": 0,
                "all_attempts": att,
                "all_earned": earn,
                "source": "weekly_tracker",
            })
        out.sort(key=lambda x: (-x["earned"], x["display_name"]))
        return out
    except Exception:
        pass

    result = get_result()
    agg = _agg_by_campus(result.attempt_rows, result.campus_norm)
    out = []
    for key, d in sorted(agg.items()):
        tiered = [(ck, at) for ck, at in d["by_cert"].items()
                  if d["cert_tier"].get(ck) in TIERED]
        att = sum(at for _, at in tiered)
        earn = sum(d["earned_by_cert"].get(ck, 0) for ck, _ in tiered)
        out.append({
            "campus_key": key,
            "display_name": d["display_name"] or key,
            "attempts": att,
            "earned": earn,
            "pass_rate": _pct(earn, att),
            "t1_earned": d["t1_earned"],
            "t1_attempts": d["t1_attempts"],
            "all_attempts": d["attempts"],
            "all_earned": d["earned"],
            "source": "eduthings",
        })
    return out


def campus_detail(key: str) -> Optional[Dict[str, Any]]:
    """Campus detail with full IBC list (all tiers + no-tier), prefer weekly tracker."""
    try:
        import ibc_weekly  # noqa: WPS433

        weekly_row = ibc_weekly.campus_weekly(key)
    except Exception:
        weekly_row = None

    result = None
    try:
        result = get_result()
    except Exception:
        result = None

    if weekly_row:
        cert_rows = [
            {
                "name": c["name"],
                "tier": c["tier"],
                "tier_key": c["tier_key"],
                "attempts": c["attempts"],
                "earned": c["earned"],
                "failed": c.get("failed", 0),
                "pass_rate": c["pass_rate"],
                "teachers": c.get("teachers", []),
            }
            for c in weekly_row["certs"]
        ]
        teachers = []
        for c in weekly_row["certs"]:
            for t in c.get("teachers", []):
                teachers.append({
                    "name": t["name"],
                    "earned": t["earned"],
                    "attempts": t["earned"] + t.get("failed", 0),
                    "pass_rate": t.get("pass_rate", 0),
                    "cert": c["name"],
                })
        teachers.sort(key=lambda x: x["earned"], reverse=True)

        pos_rows = []
        if result:
            for o in result.active_offerings():
                camps = set(o.comprehensive_campuses) | {
                    f"Career Institute {s}" for s in o.ci_sites
                }
                if any(
                    campus_key(c) == campus_key(weekly_row["campus_key"])
                    or c.lower() == weekly_row["display_name"].lower()
                    for c in camps
                ):
                    pos_rows.append({
                        "name": o.display_name,
                        "delivery": o.delivery,
                        "t1": result.offering_tier1_eligible(o),
                    })

        att = sum(c["attempts"] for c in cert_rows)
        return {
            "campus_key": weekly_row["campus_key"],
            "display_name": weekly_row["display_name"],
            "attempts": att,
            "earned": weekly_row["earned"],
            "pass_rate": _pct(weekly_row["earned"], att) if att else weekly_row.get("success_rate", 0),
            "t1_earned": weekly_row.get("t1_earned", 0),
            "t2_earned": weekly_row.get("t2_earned", 0),
            "t3_earned": weekly_row.get("t3_earned", 0),
            "none_earned": weekly_row.get("none_earned", 0),
            "t1_attempts": 0,
            "certs": cert_rows,
            "programs": pos_rows,
            "teachers": teachers[:25],
            "source": "weekly_tracker",
        }

    if result is None:
        return None

    agg = _agg_by_campus(result.attempt_rows, result.campus_norm)
    target = None
    for k, d in agg.items():
        if campus_key(k) == campus_key(key) or k.lower() == key.lower():
            target = (k, d)
            break
    if not target:
        return None
    k, d = target
    cert_rows = []
    for ck, at in d["by_cert"].most_common():
        tier = d["cert_tier"].get(ck, "Unknown")
        e = d["earned_by_cert"].get(ck, 0)
        name = ck.split(": ", 1)[-1] if ": " in ck else ck
        cert_rows.append({
            "name": name,
            "tier": tier if tier in TIERED else ("No tier" if tier in {"Unknown", "No code", ""} else tier),
            "tier_key": _tier_key(tier),
            "attempts": at,
            "earned": e,
            "pass_rate": _pct(e, at),
        })
    cert_rows.sort(key=lambda c: (-c["earned"], c["name"]))
    teachers = sorted(d["teachers"].items(), key=lambda x: x[1]["earned"], reverse=True)[:15]
    pos_rows = []
    for o in result.active_offerings():
        camps = set(o.comprehensive_campuses) | {f"Career Institute {s}" for s in o.ci_sites}
        if any(campus_key(c) == campus_key(k) or c.lower() == k.lower() for c in camps):
            pos_rows.append({
                "name": o.display_name,
                "delivery": o.delivery,
                "t1": result.offering_tier1_eligible(o),
            })
    att = sum(c["attempts"] for c in cert_rows)
    earn = sum(c["earned"] for c in cert_rows)
    return {
        "campus_key": k,
        "display_name": d["display_name"] or k,
        "attempts": att,
        "earned": earn,
        "pass_rate": _pct(earn, att),
        "t1_earned": d["t1_earned"],
        "t1_attempts": d["t1_attempts"],
        "certs": cert_rows,
        "programs": pos_rows,
        "teachers": [
            {"name": t, "earned": td["earned"], "attempts": td["attempts"],
             "pass_rate": _pct(td["earned"], td["attempts"])}
            for t, td in teachers
        ],
        "source": "eduthings",
    }


def pos_list() -> List[Dict[str, Any]]:
    result = get_result()
    pos_stats: Dict[str, dict] = {}
    for o in result.active_offerings():
        pos_stats[o.key] = {
            "name": o.display_name,
            "delivery": o.delivery,
            "t1": result.offering_tier1_eligible(o),
            "attempts": 0,
            "earned": 0,
            "campuses": sorted(o.comprehensive_campuses | {f"CI {s}" for s in o.ci_sites}),
            "by_cert": defaultdict(lambda: {"attempts": 0, "earned": 0, "tier": "No tier", "name": ""}),
        }
    for r in result.attempt_rows:
        code = r.get("cert_code") or ""
        aligned = result.ibc_to_pos.get(code, set())
        for o in result.active_offerings():
            if not (set(o.pos_codes) & aligned):
                continue
            d = pos_stats[o.key]
            d["attempts"] += 1
            is_earned = r.get("earned") == "1"
            if is_earned:
                d["earned"] += 1
            cert_key = code or (r.get("certification_name") or "Unknown")
            cd = d["by_cert"][cert_key]
            cd["name"] = r.get("certification_name") or cert_key
            tier = r.get("tier") or "Unknown"
            cd["tier"] = tier if tier in TIERED else "No tier"
            cd["tier_key"] = _tier_key(tier)
            cd["attempts"] += 1
            if is_earned:
                cd["earned"] += 1
    items = []
    for d in pos_stats.values():
        certs = sorted(
            (
                {
                    "name": v["name"],
                    "tier": v["tier"],
                    "tier_key": v.get("tier_key", "none"),
                    "attempts": v["attempts"],
                    "earned": v["earned"],
                    "pass_rate": _pct(v["earned"], v["attempts"]),
                }
                for v in d["by_cert"].values()
                if v["earned"] > 0 or v["attempts"] > 0
            ),
            key=lambda x: (-x["earned"], x["name"]),
        )
        items.append({
            "name": d["name"],
            "delivery": d["delivery"],
            "t1": d["t1"],
            "attempts": d["attempts"],
            "earned": d["earned"],
            "campuses": d["campuses"],
            "pass_rate": _pct(d["earned"], d["attempts"]),
            "certs": certs,
        })
    items.sort(key=lambda x: (x["pass_rate"], x["earned"]), reverse=True)
    return items


def certs_list() -> List[Dict[str, Any]]:
    """District cert inventory — prefer weekly IBC Totals (all IBCs + tiers)."""
    try:
        import ibc_weekly  # noqa: WPS433

        weekly = ibc_weekly.load_weekly()
        out = []
        for c in weekly["cert_totals"]:
            out.append({
                "cert_code": "",
                "name": c["name"],
                "tier": c["tier"],
                "tier_key": c["tier_key"],
                "attempts": c["earned"],  # totals sheet is earned-focused
                "earned": c["earned"],
                "projected": c["projected"],
                "pass_rate": 0.0,
                "g12": c["g12"],
                "g11": c["g11"],
                "g10": c["g10"],
                "g9": c["g9"],
                "top_campuses": [],
                "top_teachers": [],
                "source": "weekly_tracker",
            })
        return out
    except Exception:
        pass

    result = get_result()
    agg = _agg_by_cert(result.attempt_rows, result.campus_norm)
    out = []
    for code, v in agg.items():
        tier = v["tier"] if v["tier"] in TIERED else "No tier"
        top_camps = v["earned_by_campus"].most_common(5)
        top_t = sorted(v["teachers"].items(), key=lambda x: x[1]["earned"], reverse=True)[:3]
        out.append({
            "cert_code": code,
            "name": v["name"],
            "tier": tier,
            "tier_key": _tier_key(v["tier"]),
            "attempts": v["attempts"],
            "earned": v["earned"],
            "pass_rate": _pct(v["earned"], v["attempts"]),
            "top_campuses": [{"name": c, "earned": n} for c, n in top_camps],
            "top_teachers": [
                {"name": t, "earned": td["earned"], "attempts": td["attempts"]}
                for t, td in top_t if td["earned"] > 0
            ],
            "source": "eduthings",
        })
    out.sort(key=lambda x: (x["tier_key"], -x["earned"]))
    return out


def weekly_summary() -> Dict[str, Any]:
    import ibc_weekly  # noqa: WPS433

    return ibc_weekly.load_weekly()


def export_portfolio() -> Dict[str, Any]:
    result = get_result()
    from html_renderer import write_portfolio  # noqa: WPS433

    meta = _cache.get("meta") or {}
    research = _cache.get("cert_research") or []
    out_dir = IBC_ROOT / "output" / "portfolio"
    write_portfolio(result, out_dir, meta, cert_research=research)
    return {
        "ok": True,
        "portfolio": str(out_dir / "Dallas_ISD_IBC_Portfolio.pdf"),
        "campus_combined": str(out_dir / "Dallas_ISD_Campus_Snapshots.pdf"),
        "campus_dir": str(out_dir / "campus"),
    }
