# Raspberry Pi health

`/health/` is a static page on the existing website. Its HTML, CSS and JavaScript are public; measurements are **never committed, uploaded to GitHub Pages, or sent through a public proxy**. The browser connects directly to a private Tailscale Serve endpoint. The Pi must be reachable through Tailscale, and Serve must identify an explicitly allowed user. A hidden URL or CORS alone is not authentication.

## Architecture

```text
Linux /proc + /sys + fixed Docker/systemd targets
  → pi-health-collector (5-second loop; no network listener)
  → /run/pi-health/snapshot.json (atomic, latest snapshot + 10-minute RAM history)
  → pi-health-api (unprivileged; 127.0.0.1:9101)
  → Tailscale Serve HTTPS :9443 (owner identity checked by API)
  → browser on https://androochen.com/health/
```

The collector needs root to read proportional process memory and Docker metadata. It has a private network namespace and fixed commands; no HTTP request invokes it or accepts a process/container/command parameter. The API cannot access Docker or the application configuration. It only returns the snapshot, after checking the authenticated Tailscale user and exact browser origin. Serve strips supplied identity headers before setting its authenticated identity. **Do not bind the API to any address other than loopback.** Local privileged services remain trusted.

## Installation on the existing Pi

Requires Python 3.11+, systemd, cgroup v2, Docker and an already configured Tailscale account/HTTPS. No Python packages are needed. Copy this directory to the Pi, review the fixed service/container names and disk mount in `install.sh`, then run:

```sh
sudo bash install.sh
```

The installer creates `/etc/pi-health/config.json` and `/etc/pi-health/api.env` only if absent. It derives the initial allowed user from the Pi's Tailscale owner. Review that allowlist if the Pi is tagged or owned by a different account. The origin allowlist includes only `https://androochen.com` and `https://www.androochen.com`. These configuration files stay on the Pi, outside the public repository. Missing/empty identity configuration prevents API startup.

The new private Serve route uses HTTPS port 9443 → loopback port 9101, preserving existing routes on 443 and 8443. Never use `tailscale funnel`, router port forwarding, or a public reverse proxy for it. Installation restarts only the two new monitoring services, not Docker, Nextcloud, Afterglow, Tailscale or the Pi.

On `/health/`, enter the private address shown by `tailscale serve status`, including `:9443`. It is remembered in this browser's local storage; no credential is stored. Alternatively, open `/health/#endpoint=` followed by the URL-encoded private address. The fragment is not sent to the website server and is removed from the address bar after use. Do not commit your endpoint or connection link to the public repo.

Tailscale must be connected on the viewing device. Some browsers require local network permission for a public page to reach a private server; grant it only to your own site. The page explains connection failures and retries. A visitor outside the tailnet cannot reach the API; another Tailscale identity is denied even if it can reach the device. Tagged clients without a user identity are denied. Permission rules in the tailnet still apply.

## Interpreting the measurements

- Host CPU: interval usage across all cores, excluding guest-time double counting; 100% means all cores are busy. App CPU uses cgroup cumulative CPU deltas, normalized the same way. First samples and restarted counters show unavailable until a valid interval exists.
- Host RAM: `MemTotal - MemAvailable`, so reclaimable cache is not incorrectly treated as unavailable RAM.
- App RAM: summed **PSS**, which apportions shared pages between processes. If PSS cannot be read, all processes use summed RSS and the UI labels the estimate. App process memory excludes filesystem cache. It will not sum to host RAM.
- Nextcloud includes the application, background jobs, MariaDB and Redis; expand its row to inspect them. Afterglow includes child processes in its service cgroup. Missing measurements are `null`, never fabricated zeros.
- “Running” is a Docker/systemd process state, not an application-level readiness probe. No Nextcloud or Afterglow credentials are read.
- CPU temperature comes from the Pi thermal sensor. Uptime is since boot. Disk space includes system and the expected SSD mount; an absent SSD reports unavailable instead of silently displaying the root disk.
- History holds at most 120 samples in collector RAM and resets when it restarts. Samples older than 20 seconds are rejected by the API. The page marks last-known values as stale after a failed refresh. Polling pauses in hidden tabs.

This Pi has its kernel memory controller disabled, so cgroup memory counters and `MemoryMax` enforcement are unavailable. The collector deliberately uses process memory; enabling the kernel controller or rebooting is not required. CPU quotas remain configured. No logs, environment variables, filenames, process arguments, internal addresses, versions, or application data are included in the API response.

## Verification and operation

```sh
python3 -m unittest discover -s tests -p 'test_*.py' -v  # from repository root
systemctl status pi-health-collector pi-health-api
journalctl -u pi-health-collector -u pi-health-api --since '10 minutes ago'
tailscale serve status
```

The API accepts only `GET /v1/metrics` with `X-Pi-Health: 1` and a user identity inserted by Tailscale Serve. Browser requests must originate from the explicit allowlist. Responses use `Cache-Control: no-store`. Anonymous, unauthorized-user and disallowed-origin requests return 403; missing/stale snapshots return 503. Unsupported paths/methods do not run commands. Unit tests cover these boundaries and CPU/memory accounting.

To update code, copy the monitoring files and rerun the installer; existing configuration is preserved. To disable monitoring without affecting application services:

```sh
sudo tailscale serve --https=9443 off
sudo systemctl disable --now pi-health-api pi-health-collector
```

Keep the public site's code and dependencies trustworthy: code executing on an allowed website origin can read metrics while the authorized viewer is connected. Public raw metrics would expose operational details and create unnecessary load/attack surface. A public status-only view, if ever desired, should be a separate deliberately filtered data feed.
