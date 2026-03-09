#!/usr/bin/env bash
set -euo pipefail

SITE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LAUNCH_DIR="$HOME/Library/LaunchAgents"
OUT="$SITE_DIR/content/ops-runtime.json"

python3 - "$LAUNCH_DIR" "$OUT" <<'PY'
import sys, json, plistlib, subprocess, pathlib, datetime
launch_dir = pathlib.Path(sys.argv[1])
out = pathlib.Path(sys.argv[2])

managed_prefixes = (
    'ai.openclaw.',
    'com.openclaw.',
    'work.tomsalphaclawbot.',
    'homebrew.mxcl.cloudflared'
)

items=[]
for p in sorted(launch_dir.glob('*.plist')):
    try:
        with open(p,'rb') as f:
            data=plistlib.load(f)
    except Exception:
        continue
    label = data.get('Label') or p.stem
    cmd = ' '.join(str(x) for x in (data.get('ProgramArguments') or []))
    items.append({
      'label': label,
      'file': str(p),
      'managed': label.startswith(managed_prefixes),
      'command': cmd,
      'workingDirectory': data.get('WorkingDirectory',''),
      'runAtLoad': bool(data.get('RunAtLoad',False)),
      'keepAlive': bool(data.get('KeepAlive',False)),
      'stdoutPath': data.get('StandardOutPath',''),
      'stderrPath': data.get('StandardErrorPath','')
    })

managed=[x for x in items if x['managed']]

try:
    openclaw_cron_raw = subprocess.check_output(['openclaw','cron','list'], text=True, stderr=subprocess.STDOUT).strip()
except Exception as e:
    openclaw_cron_raw = f'ERROR: {e}'

rows=[]
lines=[ln for ln in openclaw_cron_raw.splitlines() if ln.strip()]
if len(lines)>=2:
    for ln in lines[1:]:
        rows.append({'row': ln})

try:
    crontab_raw = subprocess.check_output(['crontab','-l'], text=True, stderr=subprocess.STDOUT).strip()
except subprocess.CalledProcessError as e:
    crontab_raw = (e.output or '').strip()

entries=[]
for ln in crontab_raw.splitlines():
    s=ln.strip()
    if s and not s.startswith('#'):
        entries.append({'entry': s})

obj={
  'generatedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
  'summary': {
    'launchAgentsManagedCount': len(managed),
    'launchAgentsTotalCount': len(items),
    'openclawCronJobsCount': len(rows),
    'systemCrontabEntriesCount': len(entries)
  },
  'launchAgentsManaged': managed,
  'launchAgentsAll': items,
  'openclawCron': {'raw': openclaw_cron_raw, 'rows': rows},
  'systemCrontab': {'raw': crontab_raw, 'entries': entries}
}
out.write_text(json.dumps(obj, indent=2)+"\n")
print(f"Wrote {out}")
PY
