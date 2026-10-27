/* Production-build smoke test. Run with PLAYWRIGHT_MODULE and NANALLY_FIXTURE set.
 * Uses an isolated browser profile and a seeded test save, never the user's save.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const { createHash } = require('node:crypto');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = process.cwd();
const dist = path.join(root, 'dist');
const out = path.join(root, 'nanally-browser-report');
const selectedSha = 'd0d4801995b4cfa86c12429b61699d20c00295c3a65ed3ce88dc63c1b4b1b26e';
const report = { checks: [], errors: [], warnings: [] };
let server, browser, page;
const mime = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.glb':'model/gltf-binary', '.png':'image/png', '.svg':'image/svg+xml', '.webp':'image/webp', '.ico':'image/x-icon' };
function check(name) { report.checks.push(name); console.log('PASS:', name); }
async function readSave() {
  return page.evaluate(() => new Promise((resolve, reject) => {
    const open = indexedDB.open('lantern-lane-v1', 1);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const get = db.transaction('saves').objectStore('saves').get('current');
      get.onsuccess = () => { resolve(get.result); db.close(); };
      get.onerror = () => { reject(get.error); db.close(); };
    };
  }));
}
async function eventuallySaved(predicate, description) {
  for (let i=0; i<60; i++) {
    const save = await readSave();
    if (predicate(save)) return save;
    await page.waitForTimeout(250);
  }
  throw new Error('Save did not persist: ' + description);
}
async function waitForNanally() {
  await page.waitForFunction(() => document.querySelector('#canvas-host canvas') && document.querySelector('#loading')?.classList.contains('hidden'), null, { timeout: 120000 });
  await page.waitForFunction(() => window.__modelDraws.nanally > 0, null, { timeout: 120000 });
  await page.waitForFunction(() => document.querySelector('#interaction-text')?.textContent === 'Talk to Nanally', null, { timeout: 30000 });
}
async function screenshot(name) {
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(out, name + '.png'), timeout: 90000 });
}
(async () => {
  await fs.mkdir(out, { recursive: true });
  const fixture = JSON.parse(await fs.readFile(process.env.NANALLY_FIXTURE, 'utf8'));
  const modelPath = path.join(dist, 'lantern_lane/assets/characters/nanally.glb');
  const bytes = await fs.readFile(modelPath);
  report.modelSha256 = createHash('sha256').update(bytes).digest('hex');
  report.modelBytes = bytes.length;
  assert.equal(report.modelSha256, selectedSha);
  check('Production asset is byte-identical to the selected Nanally GLB');
  server = http.createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
      if (pathname === '/__smoke') { res.writeHead(200, {'Content-Type':'text/html'}); res.end('<!doctype html><title>Isolated smoke fixture</title>'); return; }
      if (pathname === '/favicon.ico') { res.writeHead(204); res.end(); return; }
      const relative = pathname.replace(/^\/+/, '') + (pathname.endsWith('/') ? 'index.html' : '');
      const target = path.resolve(dist, relative);
      if (!target.startsWith(dist + path.sep)) { res.writeHead(403); res.end(); return; }
      const data = await fs.readFile(target);
      res.writeHead(200, {'Content-Type':mime[path.extname(target)] || 'application/octet-stream', 'Cache-Control':'no-store'});
      res.end(data);
    } catch { res.writeHead(404); res.end('Not found'); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless:true, args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'] });
  const context = await browser.newContext({ viewport:{width:1280,height:800}, deviceScaleFactor:1, reducedMotion:'reduce' });
  await context.addInitScript(() => {
    window.__modelDraws = { nanally:0, mint:0 };
    window.__observedScenes = [];
    window.__THREE_DEVTOOLS__ = new EventTarget();
    window.__THREE_DEVTOOLS__.addEventListener('observe', event => {
      if (event.detail?.isScene) window.__observedScenes.push(event.detail);
    });
    if (window.WebGL2RenderingContext) {
      const prototype = WebGL2RenderingContext.prototype;
      const draw = prototype.drawElements;
      prototype.drawElements = function(mode, count, ...rest) {
        if (mode === 4 && count === 293696 * 3) window.__modelDraws.nanally++;
        if (mode === 4 && count === 81616 * 3) window.__modelDraws.mint++;
        return draw.call(this, mode, count, ...rest);
      };
    }
  });
  page = await context.newPage();
  page.setDefaultTimeout(30000);
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') report.errors.push(message.text());
    if (message.type() === 'warning' && /unavailable|using stand-in|shader|texture/i.test(message.text())) report.warnings.push(message.text());
  });
  page.on('response', response => { if (response.status() >= 400) report.errors.push(`${response.status()} ${response.url()}`); });
  page.on('requestfailed', request => { if (!/ERR_ABORTED/.test(request.failure()?.errorText || '')) report.errors.push(`${request.url()}: ${request.failure()?.errorText}`); });
  await page.goto(origin + '/__smoke');
  await page.evaluate(save => new Promise((resolve, reject) => {
    const open = indexedDB.open('lantern-lane-v1', 1);
    open.onupgradeneeded = () => open.result.createObjectStore('saves');
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result, transaction = db.transaction('saves', 'readwrite');
      transaction.objectStore('saves').put(save, 'current');
      transaction.oncomplete = () => { db.close(); resolve(); };
      transaction.onerror = () => { db.close(); reject(transaction.error); };
    };
  }), fixture);
  const modelResponse = page.waitForResponse(r => r.url().endsWith('/assets/characters/nanally.glb') && r.status() === 200, { timeout:120000 });
  await page.goto(origin + '/lantern_lane/', { waitUntil:'domcontentloaded' });
  // Large GLBs can be evicted from DevTools' response-body cache.
  // The static file checksum is checked above; validate the browser response and draw calls separately.
  assert.ok((await modelResponse).ok(), 'Nanally GLB did not load successfully');
  await waitForNanally();
  report.renderer = await page.evaluate(() => {
    const canvas = document.querySelector('#canvas-host canvas'), gl = canvas.getContext('webgl2');
    const extension = gl.getExtension('WEBGL_debug_renderer_info');
    return extension ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  });
  check('Actual WebGL2 renderer draws the selected 293,696-triangle model');
  await screenshot('01-town');
  await page.keyboard.press('f');
  await page.waitForFunction(() => document.querySelector('#modal-title')?.textContent === 'Nanally');
  assert.match(await page.locator('#modal').innerText(), /official parcel bearer/);
  check('F opens Nanally dialogue with the parcel quest intact');
  await screenshot('02-nanally-front');
  for (let i=0; i<4; i++) await page.locator('[data-view="right"]').click();
  await screenshot('03-nanally-back');
  await page.locator('[data-view="reset"]').click();
  await page.locator('[data-view="in"]').click();
  await screenshot('04-nanally-close');
  check('Conversation orbit, reset, and zoom controls work');
  await page.keyboard.press('f');
  await page.waitForFunction(() => document.querySelector('#modal')?.classList.contains('hidden'));
  const delivered = await eventuallySaved(s => s?.quests.delivery === 'done', 'parcel completion');
  assert.equal(delivered.coins, fixture.coins + 120);
  assert.ok(delivered.rewards.includes('delivery-intro'));
  check('F completes delivery and saves its one-time 120-coin reward');
  await page.keyboard.press('q');
  await page.waitForFunction(() => /mission/i.test(document.querySelector('#modal-title')?.textContent || ''));
  assert.match(await page.locator('#modal').innerText(), /First date with Mint/i);
  await page.keyboard.press('Escape');
  check('Mission menu still opens with the Mint date mission');
  await page.waitForFunction(() => document.querySelector('#interaction-text')?.textContent === 'Talk to Nanally');
  await page.keyboard.press('f');
  await page.waitForFunction(() => document.querySelector('#modal-title')?.textContent === 'Nanally');
  assert.match(await page.locator('#modal').innerText(), /three splendid stickers/);
  await page.setViewportSize({width:390,height:844});
  await screenshot('05-mobile-conversation');
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await page.locator('[data-view="right"]').click();
  await page.locator('[data-view="reset"]').click();
  check('Mobile-width conversation renders without horizontal page overflow');
  await page.keyboard.press('f');
  await eventuallySaved(s => s?.quests.stickers === 'active', 'sticker quest start');
  check('Nanally sticker quest starts normally');
  await page.setViewportSize({width:1280,height:800});
  await page.reload({waitUntil:'domcontentloaded'});
  await waitForNanally();
  const reloaded = await readSave();
  assert.equal(reloaded.quests.delivery, 'done');
  assert.equal(reloaded.quests.stickers, 'active');
  assert.equal(reloaded.coins, fixture.coins + 120);
  check('Reload retains the replacement model, quests, and earned coins');
  report.draws = await page.evaluate(() => window.__modelDraws);
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.warnings, []);
  check('No browser errors, failed requests, shader errors, or fallback-model warnings');
  report.passed = true;
})().catch(async error => {
  report.passed = false;
  report.failure = error.stack || String(error);
  console.error(error);
  if (page) await screenshot('failure').catch(() => {});
  process.exitCode = 1;
}).finally(async () => {
  await fs.mkdir(out, {recursive:true});
  await fs.writeFile(path.join(out, 'report.json'), JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
  if (browser) await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
});
