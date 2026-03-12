#!/usr/bin/env python3
import json
import subprocess
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

SITE_DIR = Path(__file__).resolve().parents[1]
WORKSPACE_DIR = SITE_DIR.parents[1]
OUT_PATH = SITE_DIR / 'content' / 'activity.json'

REPOS = [
    WORKSPACE_DIR,
    SITE_DIR,
]

TZ = ZoneInfo('America/Los_Angeles')
WINDOW_DAYS = 30


def git_commit_dates(repo: Path, since_date: str) -> list[str]:
    cmd = [
        'git', '-C', str(repo), 'log',
        f'--since={since_date} 00:00:00',
        '--date=short',
        '--pretty=format:%ad',
    ]
    try:
        out = subprocess.check_output(cmd, text=True)
    except subprocess.CalledProcessError:
        return []
    return [ln.strip() for ln in out.splitlines() if ln.strip()]


def main() -> None:
    today = datetime.now(TZ).date()
    start = today - timedelta(days=WINDOW_DAYS - 1)

    counts: dict[str, int] = {}
    days: list[str] = []
    for i in range(WINDOW_DAYS):
        d = (start + timedelta(days=i)).isoformat()
        days.append(d)
        counts[d] = 0

    since = start.isoformat()
    for repo in REPOS:
        for d in git_commit_dates(repo, since):
            if d in counts:
                counts[d] += 1

    chart_days = [{'date': d, 'count': counts[d]} for d in days]

    previous = {}
    if OUT_PATH.exists():
        try:
            previous = json.loads(OUT_PATH.read_text())
        except Exception:
            previous = {}

    chart_changed = previous.get('days') != chart_days

    payload = {
        'days': chart_days,
        # only bump timestamp when chart data actually changes
        'updatedAt': (
            datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
            if chart_changed or not previous.get('updatedAt')
            else previous.get('updatedAt')
        ),
        'sources': [str(p) for p in REPOS],
        'windowDays': WINDOW_DAYS,
        'timezone': 'America/Los_Angeles',
    }

    if previous == payload:
        print(f'NO_CHANGE {OUT_PATH} ({WINDOW_DAYS} days)')
        return

    OUT_PATH.write_text(json.dumps(payload, indent=2) + '\n')
    print(f"WROTE {OUT_PATH} ({WINDOW_DAYS} days, changed={'yes' if chart_changed else 'no'})")


if __name__ == '__main__':
    main()
