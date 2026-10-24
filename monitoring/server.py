#!/usr/bin/env python3
"""Unprivileged, loopback-only snapshot API behind Tailscale Serve identity."""
import json
import os
from pathlib import Path
from http.server import BaseHTTPRequestHandler, HTTPServer
import time

SNAPSHOT = Path('/run/pi-health/snapshot.json')
WEB = Path('/opt/pi-health/web')
STATIC = {'/': ('index.html', 'text/html; charset=utf-8'),
          '/health/': ('index.html', 'text/html; charset=utf-8'),
          '/health.js': ('health.js', 'text/javascript; charset=utf-8'),
          '/health.css': ('health.css', 'text/css; charset=utf-8'),
          '/styles.css': ('styles.css', 'text/css; charset=utf-8'),
          '/favicon.svg': ('favicon.svg', 'image/svg+xml')}


class Handler(BaseHTTPRequestHandler):
    server_version = 'PiHealth'
    sys_version = ''

    def setup(self):
        super().setup()
        self.connection.settimeout(3)

    def log_message(self, *_):
        pass

    def reply(self, status, payload=None, content_type='application/json'):
        body = payload if isinstance(payload, bytes) else json.dumps(payload, separators=(',', ':')).encode() if payload is not None else b''
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Referrer-Policy', 'no-referrer')
        if content_type.startswith('text/html'):
            self.send_header('Content-Security-Policy', "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'")
        self.send_header('Vary', 'Origin')
        origin = self.headers.get('Origin')
        if origin in self.server.allowed_origins:
            self.send_header('Access-Control-Allow-Origin', origin)
            self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'X-Pi-Health')
            self.send_header('Access-Control-Allow-Private-Network', 'true')
        self.end_headers()
        if body:
            self.wfile.write(body)

    def authorized(self):
        # Serve strips client-supplied identity headers, then supplies the authenticated user.
        # Never bind this service to a LAN/tailnet IP or 0.0.0.0.
        if self.headers.get('Tailscale-User-Login') not in self.server.allowed_users:
            self.reply(403, {'error': 'Tailscale identity is not authorized.'})
            return False
        origin = self.headers.get('Origin')
        if origin is not None and origin not in self.server.allowed_origins:
            self.reply(403, {'error': 'Origin is not authorized.'})
            return False
        if self.path != '/v1/metrics' and self.path not in STATIC:
            self.reply(404, {'error': 'Not found.'})
            return False
        return True

    def do_OPTIONS(self):
        if not self.authorized():
            return
        requested = {s.strip().lower() for s in self.headers.get('Access-Control-Request-Headers', '').split(',') if s.strip()}
        if self.path != '/v1/metrics' or self.headers.get('Access-Control-Request-Method') != 'GET' or requested - {'x-pi-health'}:
            self.reply(403, {'error': 'Request is not allowed.'})
            return
        self.reply(204)

    def do_GET(self):
        if not self.authorized():
            return
        if self.path in STATIC:
            filename, content_type = STATIC[self.path]
            try:
                self.reply(200, (WEB / filename).read_bytes(), content_type)
            except OSError:
                self.reply(503, {'error': 'Private view is not installed.'})
            return
        if self.headers.get('X-Pi-Health') != '1':
            self.reply(400, {'error': 'Missing dashboard request header.'})
            return
        try:
            snapshot = json.loads(SNAPSHOT.read_text())
            age = time.time() - snapshot['sampledAt']
            if not -5 <= age <= 20:
                raise ValueError('stale')
        except (OSError, ValueError, KeyError, TypeError):
            self.reply(503, {'error': 'No recent sample. Collector may be unavailable.'})
            return
        self.reply(200, snapshot)


def main():
    users = {s.strip() for s in os.environ.get('PI_HEALTH_ALLOWED_USERS', '').split(',') if s.strip()}
    origins = {s.strip() for s in os.environ.get('PI_HEALTH_ALLOWED_ORIGINS', '').split(',') if s.strip()}
    if not users or not origins:
        raise SystemExit('Explicit users and origins are required; refusing to start.')
    server = HTTPServer(('127.0.0.1', 9101), Handler)
    server.allowed_users = users
    server.allowed_origins = origins
    server.serve_forever()


if __name__ == '__main__':
    main()
