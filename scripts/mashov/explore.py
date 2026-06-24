"""
Mashov API explorer — logs in and tries common endpoint patterns to discover
what's available. Run this once interactively to map the API.

Usage:
    python explore.py
"""

import os
import json
import logging
from pathlib import Path

import requests
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
log = logging.getLogger("explore")

BASE_URL = "https://web.mashov.info/api"

CANDIDATES = [
    # Core
    "teachers", "classes", "students", "groups",
    # Attendance
    "attendance", "absences", "lesson/attendance",
    # Grades
    "grades", "marks", "gradeBook",
    # Schedule
    "schedule", "lessons", "timetable",
    # Behavior / events
    "events", "behaviors", "achievements",
    # Misc
    "subjects", "rooms", "parents", "contacts",
]


def login(session: requests.Session) -> bool:
    from fetch import login as _login
    return _login(session)


def probe(session: requests.Session, path: str) -> str:
    try:
        r = session.get(f"{BASE_URL}/{path}", timeout=10)
        if r.status_code == 200:
            data = r.json()
            count = len(data) if isinstance(data, list) else "object"
            return f"✅ {r.status_code}  ({count} items)"
        return f"❌ {r.status_code}"
    except Exception as e:
        return f"⚠️  {e}"


def main():
    session = requests.Session()
    session.headers.update({"Accept": "application/json"})

    if not login(session):
        raise SystemExit(1)

    print("\n── Endpoint probe ──────────────────────────")
    for path in CANDIDATES:
        result = probe(session, path)
        print(f"  {path:<30} {result}")
    print("────────────────────────────────────────────\n")


if __name__ == "__main__":
    main()
