#!/usr/bin/env python3
"""Build a daily snapshot of the Texas (ERCOT) grid for the home page.

Reads ERCOT's public Fuel Mix dashboard feed (the one behind
https://www.ercot.com/gridmktinfo/dashboards/fuelmix), picks the most recent
*complete* day, and writes _data/ercot.json, which the home page renders as
the "Texas grid snapshot" card.

Usage:
    python3 bin/fetch_ercot_snapshot.py                 # fetch live, write _data/ercot.json
    python3 bin/fetch_ercot_snapshot.py --fuel-mix fm.json --out /tmp/ercot.json   # offline / tests

If ERCOT can't be reached or the feed looks wrong, the existing snapshot is left
untouched and the script exits 0 so the scheduled job doesn't fail. The card
always shows the date the numbers are for.
"""

import argparse
import json
import sys
import urllib.request
from datetime import datetime
from pathlib import Path

FUEL_MIX_URL = "https://www.ercot.com/api/1/services/read/dashboards/fuel-mix.json"
HEADERS = {"User-Agent": "Mozilla/5.0 (personal portfolio snapshot; github.com/DamilolaOwolabi)", "Accept": "application/json"}

# Breakdowns of "Power Storage"; never added to totals.
SKIP_FUELS = {"Power Storage Charging", "Power Storage Discharging"}
# Order and display names for the fuel-mix bar.
FUEL_LABELS = [
    ("Natural Gas", "Gas"),
    ("Wind", "Wind"),
    ("Solar", "Solar"),
    ("Nuclear", "Nuclear"),
    ("Coal and Lignite", "Coal"),
    ("Power Storage", "Storage"),
    ("Hydro", "Hydro"),
    ("Other", "Other"),
]
FULL_DAY_READINGS = 280  # 5-minute data: 288 per day; allow a few gaps


def load(path_or_url):
    if path_or_url.startswith("http"):
        req = urllib.request.Request(path_or_url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    with open(path_or_url, encoding="utf-8") as f:
        return json.load(f)


def parse_ts(ts):
    # ERCOT timestamps look like "2026-10-17 15:00:00-0500"
    return datetime.strptime(ts, "%Y-%m-%d %H:%M:%S%z")


def gen(fuels, name):
    v = fuels.get(name)
    return float(v.get("gen") or 0) if isinstance(v, dict) else 0.0


def pick_day(data):
    """Most recent day with a full set of readings; else the day with the most readings."""
    days = {d: v for d, v in data.items() if isinstance(v, dict) and v}
    if not days:
        raise ValueError("fuel-mix feed has no data")
    full = [d for d, v in days.items() if len(v) >= FULL_DAY_READINGS]
    day = max(full) if full else max(days, key=lambda d: (len(days[d]), d))
    return day, days[day]


def summarize(fm):
    day, readings = pick_day(fm.get("data", {}))
    rows = []
    for ts, fuels in readings.items():
        if not isinstance(fuels, dict) or "Natural Gas" not in fuels:
            continue  # skip partial readings
        total = sum(gen(fuels, k) for k in fuels if k not in SKIP_FUELS and gen(fuels, k) > 0)
        rows.append((parse_ts(ts), fuels, total))
    if len(rows) < 24:
        raise ValueError(f"only {len(rows)} usable readings for {day}")
    rows.sort(key=lambda r: r[0])

    energy = {name: sum(max(gen(f, name), 0) for _, f, _ in rows) for name, _ in FUEL_LABELS}
    energy_total = sum(energy.values()) or 1
    shares = [
        {"key": label.lower(), "label": label, "pct": round(100 * energy[name] / energy_total, 1)}
        for name, label in FUEL_LABELS
        if energy[name] / energy_total >= 0.005
    ]

    peak_ts, _, peak_total = max(rows, key=lambda r: r[2])
    wind_peak_ts, wind_peak_f, _ = max(rows, key=lambda r: gen(r[1], "Wind"))

    hourly = {}
    for ts, _, total in rows:
        hourly.setdefault(ts.hour, []).append(total)
    hourly_avg = [round(sum(v) / len(v)) for _, v in sorted(hourly.items())]

    wind_pct = 100 * energy["Wind"] / energy_total
    solar_pct = 100 * energy["Solar"] / energy_total
    return {
        "day": day,
        "day_label": datetime.strptime(day, "%Y-%m-%d").strftime("%b %-d, %Y"),
        "complete_day": len(readings) >= FULL_DAY_READINGS,
        "peak_gen_mw": round(peak_total),
        "peak_time": peak_ts.strftime("%-I:%M %p"),
        "avg_gen_mw": round(sum(r[2] for r in rows) / len(rows)),
        "wind_share_pct": round(wind_pct, 1),
        "solar_share_pct": round(solar_pct, 1),
        "renewable_share_pct": round(wind_pct + solar_pct, 1),
        "wind_peak_mw": round(gen(wind_peak_f, "Wind")),
        "wind_peak_time": wind_peak_ts.strftime("%-I:%M %p"),
        "fuel_shares": shares,
        "hourly_gen_mw": hourly_avg,
    }


def sparkline_path(values, width=240, height=48, pad=3):
    if len(values) < 2:
        return ""
    lo, hi = min(values), max(values)
    span = (hi - lo) or 1
    step = (width - 2 * pad) / (len(values) - 1)
    pts = [(pad + i * step, pad + (height - 2 * pad) * (1 - (v - lo) / span)) for i, v in enumerate(values)]
    return "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in pts)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="_data/ercot.json")
    ap.add_argument("--fuel-mix", default=FUEL_MIX_URL)
    args = ap.parse_args()

    try:
        summary = summarize(load(args.fuel_mix))
    except Exception as exc:  # network errors, bot challenges (HTML instead of JSON), format changes
        print(f"ERCOT snapshot not updated: {exc}", file=sys.stderr)
        return 0

    snapshot = {
        "source": "ERCOT Fuel Mix dashboard",
        "source_url": "https://www.ercot.com/gridmktinfo/dashboards/fuelmix",
        "generated_at": datetime.now().astimezone().isoformat(timespec="seconds"),
        **summary,
        "sparkline_path": sparkline_path(summary["hourly_gen_mw"]),
    }
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(snapshot, indent=2) + "\n", encoding="utf-8")
    print(
        f"Wrote {out} for {summary['day']}: peak {summary['peak_gen_mw']} MW at {summary['peak_time']}, "
        f"wind {summary['wind_share_pct']}%, solar {summary['solar_share_pct']}%"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
