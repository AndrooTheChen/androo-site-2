#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if [ "$(id -u)" -ne 0 ]; then echo 'Run with sudo on the Pi.' >&2; exit 1; fi
install -d -m 0755 /opt/pi-health
install -d -m 0700 /etc/pi-health
install -m 0644 collector.py server.py /opt/pi-health/
if [ ! -e /etc/pi-health/config.json ]; then
  python3 - <<'PY'
import json
from pathlib import Path
config = {'nextcloudContainers': {'App':'personal-cloud-app-1','Background jobs':'personal-cloud-cron-1','Database':'personal-cloud-db-1','Redis':'personal-cloud-redis-1'},
          'afterglowUnit':'afterglow.service', 'disks':{'System':'/','Nextcloud SSD':'/srv/nextcloud-storage'}}
Path('/etc/pi-health/config.json').write_text(json.dumps(config, indent=2))
PY
fi
if [ ! -e /etc/pi-health/api.env ]; then
  python3 - <<'PY'
import json, subprocess
from pathlib import Path
status = json.loads(subprocess.check_output(['tailscale','status','--json'], text=True))
owner = status['User'][str(status['Self']['UserID'])]['LoginName']
if not owner or any(c in owner for c in '\n\r, "\\'):
    raise SystemExit('Unexpected Tailscale owner; set an explicit allowlist manually.')
Path('/etc/pi-health/api.env').write_text('PI_HEALTH_ALLOWED_USERS=' + owner + '\nPI_HEALTH_ALLOWED_ORIGINS=https://androochen.com,https://www.androochen.com\n')
PY
fi
chmod 0600 /etc/pi-health/config.json /etc/pi-health/api.env
install -m 0644 pi-health-collector.service pi-health-api.service /etc/systemd/system/
systemd-analyze verify /etc/systemd/system/pi-health-collector.service /etc/systemd/system/pi-health-api.service
systemctl daemon-reload
systemctl enable pi-health-collector.service pi-health-api.service
systemctl restart pi-health-collector.service pi-health-api.service
# Add a distinct port; preserve the existing Nextcloud and Afterglow routes.
tailscale serve --bg --https=9443 http://127.0.0.1:9101
systemctl is-active pi-health-collector.service pi-health-api.service
