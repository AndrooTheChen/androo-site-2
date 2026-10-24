import importlib.util
import http.client
import json
from pathlib import Path
import tempfile
import threading
import time
import unittest
from unittest.mock import patch


def module(name):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).resolve().parents[1] / 'monitoring' / (name + '.py'))
    loaded = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(loaded)
    return loaded


collector = module('collector')
api = module('server')


class Accounting(unittest.TestCase):
    def test_host_cpu_interval(self):
        self.assertEqual(collector.cpu_percent((1000, 500), (1400, 800)), 25)
        self.assertIsNone(collector.cpu_percent(None, (1000, 500)))
        self.assertIsNone(collector.cpu_percent((1000, 500), (1000, 500)))

    def test_app_cpu_normalized_and_reset(self):
        self.assertEqual(collector.usage_percent(('/a', 1000000, 10), '/a', 3000000, 11, 4), 50)
        self.assertIsNone(collector.usage_percent(('/a', 1000000, 10), '/b', 3000000, 11, 4))
        self.assertIsNone(collector.usage_percent(('/a', 3000000, 10), '/a', 1000000, 11, 4))

    def test_unavailable_component_never_becomes_zero(self):
        components = [{'state': 'running', 'cpuPercent': 4, 'memoryBytes': 123, 'memoryMethod': 'PSS'},
                      {'state': 'unavailable', 'cpuPercent': None, 'memoryBytes': None, 'memoryMethod': 'unavailable'}]
        app = collector.aggregate(components)
        self.assertEqual(app['state'], 'degraded')
        self.assertIsNone(app['cpuPercent'])
        self.assertIsNone(app['memoryBytes'])

    def test_process_memory_prefers_pss(self):
        def read(path):
            return 'VmRSS:\t100 kB\n' if path.name == 'status' else 'Pss: 40 kB\n'
        with patch.object(Path, 'read_text', read):
            self.assertEqual(collector.process_memory({1, 2}), (80 * 1024, 'PSS'))

    def test_process_memory_fallback_is_labelled(self):
        def read(path):
            if path.name == 'smaps_rollup':
                raise PermissionError()
            return 'VmRSS:\t100 kB\n'
        with patch.object(Path, 'read_text', read):
            self.assertEqual(collector.process_memory({1, 2}), (200 * 1024, 'RSS estimate'))


class Security(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.snapshot = Path(self.temp.name) / 'snapshot.json'
        self.snapshot.write_text(json.dumps({'sampledAt': time.time(), 'host': {'cpuPercent': 7}}))
        self.patch = patch.object(api, 'SNAPSHOT', self.snapshot)
        self.patch.start()
        self.server = api.HTTPServer(('127.0.0.1', 0), api.Handler)
        self.server.allowed_users = {'owner@example.com'}
        self.server.allowed_origins = {'https://androochen.com'}
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()
        self.patch.stop()
        self.temp.cleanup()

    def request(self, method='GET', headers=None, path='/v1/metrics'):
        connection = http.client.HTTPConnection(*self.server.server_address, timeout=2)
        connection.request(method, path, headers=headers or {})
        response = connection.getresponse()
        result = response.status, dict(response.getheaders()), response.read()
        connection.close()
        return result

    def auth(self, **kwargs):
        return {'Tailscale-User-Login': 'owner@example.com', 'Origin': 'https://androochen.com', 'X-Pi-Health': '1', **kwargs}

    def test_rejects_anonymous_and_other_users(self):
        for headers in [{}, {'Tailscale-User-Login': 'friend@example.com'}, {'Origin': 'https://androochen.com', 'X-Pi-Health': '1'}]:
            status, _, body = self.request(headers=headers)
            self.assertEqual(status, 403)
            self.assertNotIn(b'cpuPercent', body)

    def test_cross_origin_read_denied(self):
        status, headers, body = self.request(headers=self.auth(Origin='https://evil.example'))
        self.assertEqual(status, 403)
        self.assertNotIn('Access-Control-Allow-Origin', headers)
        self.assertNotIn(b'cpuPercent', body)

    def test_authorized_request_no_cache(self):
        status, headers, body = self.request(headers=self.auth())
        self.assertEqual(status, 200)
        self.assertEqual(headers['Access-Control-Allow-Origin'], 'https://androochen.com')
        self.assertEqual(headers['Cache-Control'], 'no-store')
        self.assertIn(b'cpuPercent', body)

    def test_cors_preflight(self):
        status, headers, _ = self.request('OPTIONS', self.auth(**{'Access-Control-Request-Method': 'GET', 'Access-Control-Request-Headers': 'x-pi-health'}))
        self.assertEqual(status, 204)
        self.assertEqual(headers['Access-Control-Allow-Private-Network'], 'true')
        status, _, _ = self.request('OPTIONS', self.auth(**{'Access-Control-Request-Method': 'POST'}))
        self.assertEqual(status, 403)

    def test_stale_or_missing_sample_is_not_healthy(self):
        self.snapshot.write_text(json.dumps({'sampledAt': time.time() - 30}))
        self.assertEqual(self.request(headers=self.auth())[0], 503)
        self.snapshot.unlink()
        self.assertEqual(self.request(headers=self.auth())[0], 503)

    def test_no_arbitrary_path_or_mutation(self):
        self.assertEqual(self.request(headers=self.auth(), path='/etc/passwd')[0], 404)
        self.assertEqual(self.request('POST', self.auth())[0], 501)
        headers = self.auth()
        headers.pop('X-Pi-Health')
        self.assertEqual(self.request(headers=headers)[0], 400)

    def test_private_view_is_identity_protected_and_fixed_path(self):
        (Path(self.temp.name) / 'index.html').write_text('<h1>Private dashboard</h1>')
        with patch.object(api, 'WEB', Path(self.temp.name)):
            self.assertEqual(self.request(path='/health/')[0], 403)
            status, headers, body = self.request(path='/health/', headers=self.auth())
            self.assertEqual(status, 200)
            self.assertIn('text/html', headers['Content-Type'])
            self.assertIn("frame-ancestors 'none'", headers['Content-Security-Policy'])
            self.assertIn(b'Private dashboard', body)
            self.assertEqual(self.request(path='/../api.env', headers=self.auth())[0], 404)


if __name__ == '__main__':
    unittest.main()
