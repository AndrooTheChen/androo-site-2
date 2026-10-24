const $ = id => document.getElementById(id);
const root = $('health-dashboard');
const privateView = location.hostname.endsWith('.ts.net');
const endpoint = privateView ? location.origin : root.dataset.endpoint;
let timer, controller, generation = 0, lastSample = null;
const finite = value => typeof value === 'number' && Number.isFinite(value);
const percent = value => finite(value) ? `${value.toFixed(1)}%` : '—';
const bytes = value => !finite(value) ? '—' : value >= 2 ** 30 ? `${(value / 2 ** 30).toFixed(1)} GiB` : `${(value / 2 ** 20).toFixed(0)} MiB`;
const safe = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
function meter(value) { return Math.max(0, Math.min(100, finite(value) ? value : 0)); }
function state(name, label, message = '') {
  root.dataset.connection = name;
  $('connection-state').textContent = label;
  $('health-message').textContent = message;
}
function value(id, number, suffix) {
  $(id).replaceChildren();
  $(id).append(finite(number) ? number.toFixed(1) : '—');
  if (finite(number)) { const small = document.createElement('small'); small.textContent = suffix; $(id).append(small); }
}
function drawHistory(history, sampledAt) {
  const samples = history.filter(point => finite(point.at) && point.at <= sampledAt && point.at >= sampledAt - 600);
  for (const key of ['cpu', 'memory']) {
    let penDown = false, lastAt = null;
    const path = samples.map(point => {
      if (!finite(point[key])) { penDown = false; return ''; }
      if (lastAt !== null && point.at - lastAt > 15) penDown = false;
      const x = (point.at - (sampledAt - 600)) / 600 * 1000;
      const y = 179 - meter(point[key]) / 100 * 178;
      const command = penDown ? 'L' : 'M'; penDown = true; lastAt = point.at;
      return `${command}${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(' ');
    $(`${key}-line`).setAttribute('d', path);
  }
  $('chart-empty').hidden = samples.length > 1;
  $('health-chart').setAttribute('aria-label', `CPU and memory percentages over the last ten minutes. Latest CPU ${percent(samples.at(-1)?.cpu)}, memory ${percent(samples.at(-1)?.memory)}.`);
}
function appHTML(app, totalMemory) {
  const cpu = meter(app.cpuPercent), mem = meter(app.memoryBytes / totalMemory * 100);
  const running = app.state === 'running';
  const appState = running ? 'Running' : app.state === 'unavailable' ? 'Unavailable' : 'Needs attention';
  const details = app.components ? `<details class="health-app-details"><summary>App, background jobs, database & cache</summary><div class="health-components">${app.components.map(c => `<div><strong>${safe(c.name)}</strong><span>${safe(c.state)} · ${percent(c.cpuPercent)} CPU · ${bytes(c.memoryBytes)}</span></div>`).join('')}</div></details>` : '';
  return `<div class="health-app-row"><div class="health-app-title"><span class="health-app-icon ${app.id === 'afterglow' ? 'afterglow' : ''}" aria-hidden="true">${app.id === 'afterglow' ? 'a' : 'n'}</span><div><div class="health-app-name">${safe(app.name)}</div><div class="health-app-state ${running ? 'running' : 'degraded'}">${appState}</div></div></div><div class="health-app-stat"><label>CPU <strong>${percent(app.cpuPercent)}</strong></label><div class="health-meter"><span style="width:${cpu}%"></span></div><small>Share of all CPU cores</small></div><div class="health-app-stat"><label>Memory <strong>${bytes(app.memoryBytes)}</strong></label><div class="health-meter memory"><span style="width:${mem}%"></span></div><small>${safe(app.memoryMethod)} · ${finite(app.memoryBytes) ? percent(app.memoryBytes / totalMemory * 100) + ' of RAM' : 'No current measurement'}</small></div></div>${details}`;
}
function render(data) {
  if (data.schemaVersion !== 1 || !finite(data.sampledAt) || !data.host?.memory || !Array.isArray(data.apps) || !Array.isArray(data.history)) throw Error('The Pi returned an unsupported metrics response.');
  const age = Date.now() / 1000 - data.sampledAt;
  if (age > 20 || age < -30) throw Error('The latest sample is stale, or the device clocks differ. Check the Pi collector and clocks.');
  const host = data.host;
  value('cpu-value', host.cpuPercent, '%'); value('memory-value', host.memory.percent, '%'); value('temperature-value', host.temperatureC, '°C');
  $('cpu-meter').style.width = `${meter(host.cpuPercent)}%`; $('memory-meter').style.width = `${meter(host.memory.percent)}%`;
  $('cpu-detail').textContent = `${host.cores} cores · total capacity`;
  $('memory-detail').textContent = `${bytes(host.memory.usedBytes)} / ${bytes(host.memory.totalBytes)}`;
  const hours = Math.floor(host.uptimeSeconds / 3600), minutes = Math.floor(host.uptimeSeconds / 60) % 60;
  $('uptime-value').textContent = hours >= 24 ? `${Math.floor(hours / 24)}d ${hours % 24}h` : `${hours}h ${minutes}m`;
  drawHistory(data.history, data.sampledAt);
  const details = $('app-list').querySelector('details');
  const expanded = details?.open;
  const detailsFocused = details && document.activeElement === details.querySelector('summary');
  $('app-list').innerHTML = data.apps.map(app => appHTML(app, host.memory.totalBytes)).join('');
  if (expanded && $('app-list').querySelector('details')) $('app-list').querySelector('details').open = true;
  if (detailsFocused) $('app-list').querySelector('summary')?.focus({preventScroll:true});
  $('disk-list').innerHTML = host.disks.map(disk => `<article class="health-disk"><div class="health-disk-heading"><strong>${safe(disk.name)}</strong><span>${disk.available ? percent(disk.percent) : 'Unavailable'}</span></div><div class="health-meter"><span style="width:${meter(disk.percent)}%"></span></div><p>${disk.available ? `${bytes(disk.usedBytes)} used of ${bytes(disk.totalBytes)} · ${bytes(disk.freeBytes)} available` : 'The expected disk is not mounted or cannot be read.'}</p></article>`).join('');
  lastSample = data.sampledAt;
  $('sample-time').textContent = `Sampled ${new Date(data.sampledAt * 1000).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'})}`;
  const attention = data.apps.some(app => app.state !== 'running') || host.disks.some(disk => !disk.available);
  state('live', 'Live', attention ? 'A service or disk needs attention. See the details below.' : '');
}
async function refresh() {
  clearTimeout(timer);
  if (!endpoint || document.hidden) return;
  controller?.abort();
  const current = ++generation;
  controller = new AbortController();
  const requestController = controller;
  const timeout = setTimeout(() => requestController.abort(), 8000);
  $('refresh-health').disabled = true;
  try {
    const response = await fetch(endpoint + '/v1/metrics', {mode:'cors', credentials:'omit', cache:'no-store', redirect:'error', headers:{'X-Pi-Health':'1'}, signal:requestController.signal});
    if (current !== generation) return;
    if (!response.ok) throw Error(response.status === 403 ? 'This Tailscale account is not authorized to view metrics.' : response.status === 503 ? 'The Pi collector has no fresh sample. Retrying shortly.' : `The metrics service returned HTTP ${response.status}.`);
    const data = await response.json();
    if (current !== generation) return;
    render(data);
  } catch (error) {
    if (current !== generation) return;
    const message = error.name === 'TypeError' || error.name === 'AbortError' ? (privateView ? 'Cannot reach your Pi. Check that Tailscale is connected and the Pi is on. Retrying every 5 seconds.' : 'Turn on Tailscale, then choose Open private dashboard above. Your browser may block private data from loading directly on this public page.') : error.message;
    state(lastSample ? 'stale' : 'error', lastSample ? 'Stale · reconnecting' : 'Unavailable', message + (lastSample ? ' Values below are the last received sample.' : ''));
  } finally {
    clearTimeout(timeout);
    if (current === generation) { $('refresh-health').disabled = false; timer = setTimeout(refresh, 5000); }
  }
}
$('refresh-health').addEventListener('click', refresh);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { generation++; controller?.abort(); clearTimeout(timer); if (endpoint) state(lastSample ? 'stale' : 'disconnected', 'Paused', 'Updates paused while this tab is hidden.'); }
  else if (endpoint) refresh();
});
$('connection-panel').hidden = privateView;
// Old bookmarked connection fragments remain harmless; routing is now preconfigured.
if (location.hash.startsWith('#endpoint=')) history.replaceState(null, '', location.pathname + location.search);
state('connecting', 'Connecting', 'Connecting securely through Tailscale…');
refresh();
