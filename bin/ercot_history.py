#!/usr/bin/env python3
"""Daily ERCOT fuel-mix history for the /grid/ dashboard (_data/ercot_history.json).

Each record is one day:
    {"date": "2026-09-01", "total_gwh": 1234.5, "peak_gw": 61.2,
     "share": {"gas": 41.2, "wind": 22.0, "solar": 21.6, "nuclear": 9.1, "coal": 5.8, "hydro": 0.1, "other": 0.2},
     "src": "report" | "dashboard"}

Shares are percentages of that day's generation, excluding energy storage
(storage both charges and discharges, so it is left out of the mix).

Two sources feed it:
  * report: ERCOT's annual Fuel Mix Report workbook (IntGenbyFuelYYYY.xlsx,
    15-minute settlement data). `python3 bin/ercot_history.py refresh` downloads
    the current year's workbook; `... backfill FILE.xlsx` loads a local copy.
  * daily: fetch_ercot_snapshot.py calls add_dashboard_day() with the 5-minute
    data from ERCOT's public fuel-mix dashboard feed.
Report data wins over dashboard data for the same day.
"""

import json
import re
import sys
from pathlib import Path

HISTORY_PATH = Path("_data/ercot_history.json")
CATEGORIES = ["gas", "wind", "solar", "nuclear", "coal", "hydro", "other"]

# Workbook fuel names -> categories (WSL = storage charging load, excluded)
REPORT_MAP = {"Gas": "gas", "Gas-CC": "gas", "Wind": "wind", "Solar": "solar", "Nuclear": "nuclear", "Coal": "coal", "Hydro": "hydro", "Biomass": "other", "Other": "other"}
# Dashboard feed names -> categories (Power Storage excluded)
DASHBOARD_MAP = {"Natural Gas": "gas", "Wind": "wind", "Solar": "solar", "Nuclear": "nuclear", "Coal and Lignite": "coal", "Hydro": "hydro", "Other": "other"}


def load_history(path=HISTORY_PATH):
    try:
        return {r["date"]: r for r in json.loads(Path(path).read_text(encoding="utf-8"))}
    except FileNotFoundError:
        return {}


def save_history(records, path=HISTORY_PATH):
    rows = [records[d] for d in sorted(records)]
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text(json.dumps(rows, separators=(",", ":")) + "\n", encoding="utf-8")
    return len(rows)


def make_record(date, energy_mwh, peak_mw, src):
    total = sum(max(energy_mwh.get(c, 0.0), 0.0) for c in CATEGORIES)
    if total <= 0:
        return None
    return {
        "date": date,
        "total_gwh": round(total / 1000, 1),
        "peak_gw": round(peak_mw / 1000, 2),
        "share": {c: round(100 * max(energy_mwh.get(c, 0.0), 0.0) / total, 2) for c in CATEGORIES},
        "src": src,
    }


def records_from_report(xlsx_path):
    """Parse the monthly sheets of an IntGenbyFuel workbook into daily records."""
    import openpyxl  # only needed for backfill

    wb = openpyxl.load_workbook(xlsx_path, read_only=True, data_only=True)
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    days = {}
    for name in months:
        if name not in wb.sheetnames:
            continue
        rows = wb[name].iter_rows(values_only=True)
        header = next(rows, None)
        if not header:
            continue
        for row in rows:
            if not row or row[0] is None or row[1] not in REPORT_MAP:
                continue
            date = row[0].strftime("%Y-%m-%d") if hasattr(row[0], "strftime") else str(row[0])[:10]
            if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", date):
                continue  # skip anything that isn't a plain date
            intervals = [v if isinstance(v, (int, float)) else 0.0 for v in row[4:]]
            d = days.setdefault(date, {"energy": {}, "intervals": [0.0] * len(intervals)})
            cat = REPORT_MAP[row[1]]
            d["energy"][cat] = d["energy"].get(cat, 0.0) + float(row[3] or 0)
            if len(d["intervals"]) < len(intervals):
                d["intervals"] += [0.0] * (len(intervals) - len(d["intervals"]))
            for i, v in enumerate(intervals):
                d["intervals"][i] += max(v, 0.0)
    out = {}
    for date, d in days.items():
        peak_mw = max(d["intervals"]) * 4 if d["intervals"] else 0  # 15-minute MWh -> average MW
        rec = make_record(date, d["energy"], peak_mw, "report")
        if rec:
            out[date] = rec
    return out


def dashboard_day_record(date, readings):
    """readings: {timestamp: {fuel: {"gen": MW}}} for one day of 5-minute dashboard data."""
    energy, peak = {}, 0.0
    for fuels in readings.values():
        if not isinstance(fuels, dict) or "Natural Gas" not in fuels:
            continue
        step_total = 0.0
        for name, cat in DASHBOARD_MAP.items():
            v = fuels.get(name)
            mw = float(v.get("gen") or 0) if isinstance(v, dict) else 0.0
            mw = max(mw, 0.0)
            energy[cat] = energy.get(cat, 0.0) + mw * (5 / 60)  # MW over 5 minutes -> MWh
            step_total += mw
        peak = max(peak, step_total)
    return make_record(date, energy, peak, "dashboard")


def add_dashboard_day(date, readings, path=HISTORY_PATH):
    records = load_history(path)
    if records.get(date, {}).get("src") == "report":
        return False
    rec = dashboard_day_record(date, readings)
    if not rec:
        return False
    records[date] = rec
    save_history(records, path)
    return True


def refresh_from_report(year=None):
    """Find this year's IntGenbyFuel workbook on ercot.com, download it, and merge it in."""
    import re
    import tempfile
    import urllib.request
    from datetime import date

    year = year or date.today().year
    headers = {"User-Agent": "Mozilla/5.0 (personal portfolio snapshot; github.com/DamilolaOwolabi)"}
    page = urllib.request.urlopen(urllib.request.Request("https://www.ercot.com/gridinfo/generation", headers=headers), timeout=30).read().decode("utf-8", "replace")
    m = re.search(r'href="([^"]*IntGenbyFuel%d\.xlsx)"' % year, page)
    if not m:
        raise ValueError(f"no IntGenbyFuel{year}.xlsx link found")
    url = m.group(1) if m.group(1).startswith("http") else "https://www.ercot.com" + m.group(1)
    data = urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=120).read()
    if not data.startswith(b"PK"):
        raise ValueError("download was not an xlsx file")
    with tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False) as f:
        f.write(data)
    records = load_history()
    new = records_from_report(f.name)
    records.update(new)
    n = save_history(records)
    return len(new), n


def main(argv):
    if len(argv) >= 2 and argv[1] == "refresh":
        try:
            got, n = refresh_from_report()
            print(f"Merged {got} report days; history has {n} days.")
        except Exception as exc:  # keep the scheduled job green; history just isn't extended
            print(f"Report refresh skipped: {exc}", file=sys.stderr)
        return 0
    if len(argv) >= 3 and argv[1] == "backfill":
        records = load_history()
        added = 0
        for xlsx in argv[2:]:
            for date, rec in records_from_report(xlsx).items():
                records[date] = rec  # report data replaces dashboard data
                added += 1
        n = save_history(records)
        print(f"Backfilled {added} days; history now has {n} days ({min(records)} to {max(records)}).")
        return 0
    print(__doc__)
    return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
