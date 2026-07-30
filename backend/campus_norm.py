"""Unified campus name normalization for Enrollment + IBC joins."""

from __future__ import annotations

from typing import Dict, Optional

# Enrollment matrix short names ← full SIS school names
ENROLLMENT_NAME_MAP: Dict[str, str] = {
    "W H Adamson High School": "Adamson",
    "Bryan Adams High School Leadership Academy": "Bryan Adams",
    "David W Carter High School": "Carter",
    "Emmett J Conrad High School": "Conrad",
    "Hillcrest High School": "Hillcrest",
    "Thomas Jefferson High School": "Jefferson",
    "Justin F Kimball High School": "Kimball",
    "Lincoln Humanities/Communications Magnet High Sch": "Lincoln",
    "James Madison High School": "Madison",
    "Moises E Molina High School": "Molina",
    "North Dallas High School": "North Dallas",
    "Dr L G Pinkston Sr High School": "Pinkston",
    "Franklin D Roosevelt High School Of Innovation": "Roosevelt",
    "W W Samuell High School": "Samuell",
    "Seagoville High School": "Seagoville",
    "Skyline High School": "Skyline",
    "South Oak Cliff High School": "South Oak Cliff",
    "H Grady Spruce High School": "Spruce",
    "Sunset High School": "Sunset",
    "W T White High School": "WT White",
    "Wilmer-Hutchins High School": "Wilmer-Hutchins",
    "Woodrow Wilson High School": "Woodrow Wilson",
    "CityLab High School": "City Lab",
    "Diane Ragsdale CityLab HS": "City Lab",
    "Innovation Design Entrepreneurship Academy": "IDEA",
    "Gertrudis Tula and Hector M. Flores I.D.E.A.": "IDEA",
    "Barack Obama Male Leadership Academy at A. Maceo Smith": "Obama",
    "New Tech High School at B.F. Darrell": "Smith New Tech",
    "Rosie Sorrells Education and Social Services HS": "Sorrells Education/Social Services",
    "Judge Barefoot Sanders Law Magnet at Townview": "Sanders Public Service, Law",
    "Robinson School of Business Mgmt at Townview Center": "School of Business/Management",
    "Townview Health Professions": "School of Health Professions",
    "Townview Science & Engineering": "School of Science & Engineering",
    "School for the Talented and Gifted in Pleasant Grove": "School for Talented & Gifted",
    "Townview Talented & Gifted": "School for Talented & Gifted",
    "Kathlyn Joy Gilliam Collegiate Academy": "Gilliam",
    "Irma Rangel Young Women's Leadership School": "Rangel YWLS",
}

# IBC portfolio short names (Eduthings / PEIMS style) → enrollment keys
IBC_TO_ENROLLMENT: Dict[str, str] = {
    "Adamson": "Adamson",
    "Bryan Adams": "Bryan Adams",
    "Carter": "Carter",
    "Conrad": "Conrad",
    "Hillcrest": "Hillcrest",
    "Jefferson": "Jefferson",
    "Kimball": "Kimball",
    "Lincoln": "Lincoln",
    "Madison": "Madison",
    "Molina": "Molina",
    "North Dallas": "North Dallas",
    "L.G. Pinkston": "Pinkston",
    "Pinkston": "Pinkston",
    "Roosevelt": "Roosevelt",
    "Samuell": "Samuell",
    "Seagoville": "Seagoville",
    "Skyline": "Skyline",
    "South Oak Cliff": "South Oak Cliff",
    "Spruce": "Spruce",
    "Sunset": "Sunset",
    "White": "WT White",
    "WT White": "WT White",
    "W T White": "WT White",
    "Wilmer-Hutchins": "Wilmer-Hutchins",
    "Wilson": "Woodrow Wilson",
    "Woodrow Wilson": "Woodrow Wilson",
    "CityLab": "City Lab",
    "City Lab": "City Lab",
    "New Tech @ Darrell": "Smith New Tech",
    "Obama MLA": "Obama",
    "Gilliam Collegiate": "Gilliam",
    "Rangel YWLS": "Rangel YWLS",
    "School of Health Professions": "School of Health Professions",
    "School of Business & Mgmt": "School of Business/Management",
    "School of Sci & Engineering": "School of Science & Engineering",
    "Manns DAEP": "Manns DAEP",
}


def enrollment_key_from_sis(name: str) -> Optional[str]:
    """Map full SIS school name → enrollment matrix campus key."""
    if name in ENROLLMENT_NAME_MAP:
        return ENROLLMENT_NAME_MAP[name]
    lower = name.lower()
    for full, short in ENROLLMENT_NAME_MAP.items():
        if short.lower() in lower:
            return short
    return None


def campus_key(name: str) -> str:
    """
    Canonical join key for enrollment ↔ IBC.
    Prefer enrollment short name when known; otherwise slugify display name.
    """
    n = (name or "").strip()
    if not n:
        return ""
    if n in IBC_TO_ENROLLMENT:
        return IBC_TO_ENROLLMENT[n]
    if n in ENROLLMENT_NAME_MAP.values():
        return n
    mapped = enrollment_key_from_sis(n)
    if mapped:
        return mapped
    # Fuzzy: match IBC short → enrollment
    for ibc, enroll in IBC_TO_ENROLLMENT.items():
        if ibc.lower() == n.lower() or enroll.lower() == n.lower():
            return enroll
    return n


def display_name(key: str) -> str:
    return key
