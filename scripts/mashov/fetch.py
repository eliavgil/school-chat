"""
Mashov API fetcher — pulls data from web.mashov.info and saves locally + uploads.
Credentials live in .env only. Run daily via cron.

Usage:
    python fetch.py            # fetch all and upload
    python fetch.py --dry-run  # fetch and save locally, skip upload
"""

import os
import json
import logging
import argparse
from datetime import datetime
from pathlib import Path

import requests
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("mashov")

BASE_URL = "https://web.mashov.info/api"
OUTPUT_DIR = Path(__file__).parent / "data"
OUTPUT_DIR.mkdir(exist_ok=True)


def login(session: requests.Session) -> bool:
    """Login to Mashov. Returns True on success."""
    semel   = os.environ["MASHOV_SEMEL"]        # school code (סמל מוסד)
    year    = os.environ.get("MASHOV_YEAR", "")
    username = os.environ["MASHOV_USERNAME"]
    password = os.environ["MASHOV_PASSWORD"]

    # Mashov requires a CSRF token before login — fetch the main page first
    session.get("https://web.mashov.info", timeout=15)

    csrf = session.cookies.get("Csrf-Token") or session.cookies.get("csrf-token", "")

    payload = {
        "semel":    int(semel),
        "year":     int(year) if year else _current_school_year(),
        "username": username,
        "password": password,
        "appName":  "info.mashov.web",
        "appVersion": "3.20231115",
    }

    headers = {"X-Csrf-Token": csrf, "Content-Type": "application/json"}

    log.info("Logging in as %s (semel=%s, year=%s)…", username, semel, payload["year"])
    r = session.post(f"{BASE_URL}/login", json=payload, headers=headers, timeout=15)

    if r.status_code != 200:
        log.error("Login failed: %s — %s", r.status_code, r.text[:300])
        return False

    # Refresh CSRF from new cookies
    new_csrf = session.cookies.get("Csrf-Token") or session.cookies.get("csrf-token", "")
    session.headers.update({"X-Csrf-Token": new_csrf})

    log.info("Logged in. Cookies: %s", list(session.cookies.keys()))
    return True


def _current_school_year() -> int:
    """Return current school year (e.g. 2024 for 2024-25)."""
    now = datetime.now()
    return now.year if now.month >= 9 else now.year - 1


def fetch_endpoint(session: requests.Session, path: str, params: dict | None = None) -> list | dict | None:
    url = f"{BASE_URL}/{path.lstrip('/')}"
    log.info("GET %s %s", url, params or "")
    r = session.get(url, params=params, timeout=30)
    if r.status_code == 200:
        return r.json()
    log.warning("  → %s  %s", r.status_code, r.text[:200])
    return None


def save(name: str, data) -> Path:
    path = OUTPUT_DIR / f"{name}.json"
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    log.info("Saved %s (%d records)", path.name, len(data) if isinstance(data, list) else 1)
    return path


def upload(name: str, data, endpoint_url: str, token: str):
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    r = requests.post(
        endpoint_url,
        json={"source": name, "data": data},
        headers=headers,
        timeout=30,
    )
    if r.status_code in (200, 201):
        log.info("Uploaded %s → OK", name)
    else:
        log.error("Upload %s failed: %s %s", name, r.status_code, r.text[:200])


def main(dry_run: bool = False):
    upload_url   = os.environ.get("SCHOOL_UPLOAD_URL", "")
    upload_token = os.environ.get("SCHOOL_UPLOAD_TOKEN", "")

    if not dry_run and not upload_url:
        log.warning("SCHOOL_UPLOAD_URL not set — running in dry-run mode")
        dry_run = True

    session = requests.Session()
    session.headers.update({"Accept": "application/json"})

    if not login(session):
        raise SystemExit(1)

    # ─── Endpoints to fetch ───────────────────────────────────────────────────
    # Each tuple: (local_name, api_path, optional_params)
    # Add or remove as you discover more endpoints.
    endpoints: list[tuple[str, str, dict | None]] = [
        ("teachers",    "teachers",             None),
        ("classes",     "classes",              None),
        ("students",    "students",             None),
        # Attendance and grades are per-class — discover classId from /classes first.
        # ("attendance",  "attendance",           {"classId": "..."}),
        # ("grades",      "grades",               {"classId": "..."}),
    ]

    results = {}
    for name, path, params in endpoints:
        data = fetch_endpoint(session, path, params)
        if data is not None:
            save(name, data)
            results[name] = data
        else:
            log.warning("Skipping %s (no data)", name)

    if not dry_run and results:
        for name, data in results.items():
            upload(name, data, upload_url, upload_token)

    log.info("Done. %d/%d endpoints fetched.", len(results), len(endpoints))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Save locally only, skip upload")
    args = parser.parse_args()
    main(dry_run=args.dry_run)
