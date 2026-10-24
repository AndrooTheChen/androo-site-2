#!/usr/bin/env python3
"""Local, fixed-target Linux metrics collector. No listening socket or app secrets."""
import json
import os
from pathlib import Path
import subprocess
import time

CONFIG = Path('/etc/pi-health/config.json')
SNAPSHOT = Path('/run/pi-health/snapshot.json')
CGROUP = Path('/sys/fs/cgroup')


def command(*args):
    return subprocess.check_output(args, text=True, timeout=4, stderr=subprocess.DEVNULL).strip()


def host_cpu():
    # Guest times are already counted in user/nice; do not count them twice.
    values = list(map(int, Path('/proc/stat').read_text().splitlines()[0].split()[1:9]))
    return sum(values), values[3] + values[4]


def cpu_percent(previous, current):
    if previous is None:
        return None
    total, idle = current[0] - previous[0], current[1] - previous[1]
    return round(max(0, min(100, 100 * (total - idle) / total)), 1) if total > 0 else None


def memory():
    values = {k: int(v.split()[0]) * 1024 for k, v in
              (line.split(':', 1) for line in Path('/proc/meminfo').read_text().splitlines())}
    total, available = values['MemTotal'], values['MemAvailable']
    return {'totalBytes': total, 'usedBytes': total - available,
            'percent': round(100 * (total - available) / total, 1)}


def cgroup_for_pid(pid):
    for line in Path(f'/proc/{pid}/cgroup').read_text().splitlines():
        if line.startswith('0::/'):
            return line[3:]
    raise ValueError('cgroup v2 required')


def process_memory(pids):
    """PSS apportions shared pages; RSS is an explicitly labelled fallback."""
    pss_total = rss_total = 0
    pss_complete = True
    read_count = 0
    for pid in pids:
        try:
            status = Path(f'/proc/{pid}/status').read_text()
            rss = next(int(line.split()[1]) * 1024 for line in status.splitlines()
                       if line.startswith('VmRSS:'))
        except (OSError, StopIteration, ValueError):
            if Path(f'/proc/{pid}').exists():
                return None, 'unavailable'
            continue  # Process exited during sampling.
        read_count += 1
        rss_total += rss
        try:
            rollup = Path(f'/proc/{pid}/smaps_rollup').read_text()
            pss_total += next(int(line.split()[1]) * 1024 for line in rollup.splitlines()
                              if line.startswith('Pss:'))
        except (OSError, StopIteration, ValueError):
            pss_complete = False
    if not read_count:
        return None, 'unavailable'
    return (pss_total, 'PSS') if pss_complete else (rss_total, 'RSS estimate')


def cgroup_sample(group):
    root = CGROUP / group.lstrip('/')
    if not root.resolve().is_relative_to(CGROUP):
        raise ValueError('invalid cgroup')
    stats = dict(line.split() for line in (root / 'cpu.stat').read_text().splitlines())
    # Include child workers and nested cgroups, not only the service's main PID.
    pids = set()
    for file in [root / 'cgroup.procs', *root.glob('**/cgroup.procs')]:
        try:
            pids.update(int(value) for value in file.read_text().split())
        except FileNotFoundError:
            pass
    size, method = process_memory(pids)
    return int(stats['usage_usec']), size, method


def usage_percent(previous, group, usage, now, cores):
    if previous is None or previous[0] != group or usage < previous[1] or now <= previous[2]:
        return None
    return round(max(0, min(100, (usage - previous[1]) / 1e6 / (now - previous[2]) / cores * 100)), 2)


def aggregate(components):
    running = all(c['state'] == 'running' for c in components)
    result = {'id': 'nextcloud', 'name': 'Nextcloud',
              'state': 'running' if running else ('unavailable' if all(c['state'] == 'unavailable' for c in components) else 'degraded'),
              'components': components}
    for key in ('cpuPercent', 'memoryBytes'):
        values = [c[key] for c in components]
        result[key] = round(sum(values), 2) if all(v is not None for v in values) else None
    methods = {c['memoryMethod'] for c in components}
    result['memoryMethod'] = methods.pop() if len(methods) == 1 else 'mixed estimates'
    return result


class Collector:
    def __init__(self, config):
        self.config = config
        self.previous_cpu = None
        self.previous_apps = {}
        self.history = []
        self.cores = os.cpu_count() or 1

    def app(self, key, name, state, group):
        result = {'id': key, 'name': name, 'state': state, 'cpuPercent': None,
                  'memoryBytes': None, 'memoryMethod': 'unavailable'}
        if state == 'running' and group:
            try:
                usage, size, method = cgroup_sample(group)
                now = time.monotonic()
                result.update(cpuPercent=usage_percent(self.previous_apps.get(key), group, usage, now, self.cores),
                              memoryBytes=size, memoryMethod=method)
                self.previous_apps[key] = (group, usage, now)
            except (OSError, ValueError, KeyError):
                self.previous_apps.pop(key, None)
        else:
            self.previous_apps.pop(key, None)
        return result

    def sample(self):
        at = time.time()
        cpu = host_cpu()
        cpu_value = cpu_percent(self.previous_cpu, cpu)
        self.previous_cpu = cpu
        mem = memory()
        containers = self.config['nextcloudContainers']
        states = {}
        try:
            output = command('/usr/bin/docker', 'inspect', '--format',
                             '{{.Name}} {{.State.Status}} {{.State.Pid}}', *containers.values())
            for line in output.splitlines():
                name, state, pid = line.split()
                states[name.lstrip('/')] = (state, int(pid))
        except (subprocess.SubprocessError, OSError, ValueError):
            pass
        components = []
        for label, container in containers.items():
            state, pid = states.get(container, ('unavailable', 0))
            group = None
            if pid:
                try:
                    group = cgroup_for_pid(pid)
                except (OSError, ValueError):
                    state = 'unavailable'
            components.append(self.app('nextcloud-' + label.lower(), label, state, group))
        try:
            props = dict(line.split('=', 1) for line in command('/usr/bin/systemctl', 'show',
                         self.config['afterglowUnit'], '-p', 'ActiveState', '-p', 'ControlGroup').splitlines())
            state = 'running' if props.get('ActiveState') == 'active' else props.get('ActiveState', 'unavailable')
            group = props.get('ControlGroup')
        except (subprocess.SubprocessError, OSError, ValueError):
            state, group = 'unavailable', None
        afterglow = self.app('afterglow', 'Afterglow', state, group)
        try:
            temp = round(int(Path('/sys/class/thermal/thermal_zone0/temp').read_text()) / 1000, 1)
        except (OSError, ValueError):
            temp = None
        disks = []
        for label, mount in self.config['disks'].items():
            # An absent SSD must not silently report the root filesystem instead.
            if mount != '/' and not os.path.ismount(mount):
                disks.append({'name': label, 'available': False})
                continue
            try:
                stat = os.statvfs(mount)
                total = stat.f_blocks * stat.f_frsize
                used = (stat.f_blocks - stat.f_bfree) * stat.f_frsize
                disks.append({'name': label, 'available': True, 'usedBytes': used, 'totalBytes': total,
                              'freeBytes': stat.f_bavail * stat.f_frsize, 'percent': round(used / total * 100, 1)})
            except OSError:
                disks.append({'name': label, 'available': False})
        self.history.append({'at': at, 'cpu': cpu_value, 'memory': mem['percent']})
        self.history = self.history[-120:]
        return {'schemaVersion': 1, 'sampledAt': at, 'intervalSeconds': 5,
                'host': {'cpuPercent': cpu_value, 'cores': self.cores, 'memory': mem,
                         'temperatureC': temp, 'uptimeSeconds': float(Path('/proc/uptime').read_text().split()[0]),
                         'disks': disks},
                'apps': [aggregate(components), afterglow], 'history': self.history}


def main():
    collector = Collector(json.loads(CONFIG.read_text()))
    while True:
        started = time.monotonic()
        try:
            sample = collector.sample()
            temporary = SNAPSHOT.with_suffix('.tmp')
            temporary.write_text(json.dumps(sample, separators=(',', ':'), allow_nan=False))
            temporary.chmod(0o644)
            temporary.replace(SNAPSHOT)
        except Exception as error:
            # Do not publish a fake healthy snapshot or leak subprocess output.
            print('Collection failed: ' + type(error).__name__, flush=True)
        time.sleep(max(0.1, 5 - (time.monotonic() - started)))


if __name__ == '__main__':
    main()
