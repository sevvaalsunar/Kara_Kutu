// Gerçek Chromium üzerinde E2E çatısı. app/cypress/ testlerinin birebir karşılıkları için yardımcılar.
// Neden: Cypress ikilisi (download.cypress.io) erişilemeyen ortamlarda aynı senaryoları gerçek bir
// tarayıcı motorunda koşturmak. Cypress testleri CI'da (.github/workflows/test.yml) koşmaya devam eder.
//
// Tarayıcı: CHROME_PATH ortam değişkeni (sistem Chrome/Chromium) veya @sparticuz/chromium (npm).
import puppeteer from 'puppeteer-core';

export const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

export async function launch() {
  let executablePath = process.env.CHROME_PATH;
  let args = ['--no-sandbox'];
  if (!executablePath) {
    const chromium = (await import('@sparticuz/chromium')).default;
    executablePath = await chromium.executablePath();
    args = chromium.args;
  }
  return puppeteer.launch({ executablePath, args, headless: true, protocolTimeout: 180000 });
}

/** Sayfa: 390×844 (cypress.config.cjs ile aynı), konsol/ağ hataları toplanır, Date.now kontrol edilebilir. */
export async function newPage(browser, { freezeDate = false } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/ERR_NAME_NOT_RESOLVED/.test(m.text())) page.errors.push(`console: ${m.text()}`); });
  page.on('requestfailed', (r) => { if (!r.url().startsWith('https://fonts.')) page.errors.push(`requestfailed: ${r.url()}`); });
  page.on('response', (r) => { if (r.status() >= 400 && !r.url().includes('bulunamayan-model')) page.errors.push(`http ${r.status()}: ${r.url()}`); });
  if (freezeDate) {
    // cy.clock(Date.now(), ['Date']) karşılığı: Date.now dondurulur, yalnızca tick ile ilerler.
    await page.evaluateOnNewDocument(() => {
      const base = Date.now();
      let off = 0;
      Date.now = () => base + off;
      window.__tick = (ms) => { off += ms; };
    });
  }
  return page;
}

const sel = (id) => `[data-testid="${id}"]`;
export const tid = sel;

export async function visit(page, path) {
  await page.goto(BASE + path, { waitUntil: 'domcontentloaded' });
  await page.mouse.move(1, 1); // fare imleci karar kartlarının üstünde kalıp sahte "hover" üretmesin
}

export async function click(page, id) {
  const el = await page.waitForSelector(sel(id), { visible: true, timeout: 10000 });
  await el.click();
  await page.mouse.move(1, 1);
}

export const exists = async (page, id) => (await page.$(sel(id))) !== null;
export const text = (page, id) => page.$eval(sel(id), (e) => e.textContent.trim());
export const attr = (page, id, a) => page.$eval(sel(id), (e, a) => e.getAttribute(a), a);
export const tick = (page, ms) => page.evaluate((ms) => window.__tick(ms), ms);
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function waitFor(page, fn, msg, timeout = 10000, ...args) {
  try {
    await page.waitForFunction(fn, { timeout, polling: 50 }, ...args);
  } catch {
    throw new Error(`Beklenen durum oluşmadı: ${msg}`);
  }
}

export const waitAttr = (page, id, a, v, timeout = 10000) =>
  waitFor(page, (s, a, v) => document.querySelector(s)?.getAttribute(a) === v, `${id}[${a}=${v}]`, timeout, sel(id), a, v);
export const waitText = (page, id, re, timeout = 10000) =>
  waitFor(page, (s, src) => new RegExp(src).test(document.querySelector(s)?.textContent ?? ''), `${id} ~ /${re}/`, timeout, sel(id), re.source ?? re);
export const waitVisible = (page, id, timeout = 10000) => page.waitForSelector(sel(id), { visible: true, timeout });
export const waitGone = (page, id) => waitFor(page, (s) => !document.querySelector(s), `${id} yok`, 5000, sel(id));

export async function modelHazir(page) {
  await waitAttr(page, 'model-status', 'data-status', 'hazir', 30000);
}

/** cy.basla karşılığı (support/e2e.js): ?test=1 ile açar, üç soruyu cevaplar, başlatır. */
export async function basla(page, seviye = 'mid', rol = 'dev', hedef = 'learn', path = '/?test=1') {
  await visit(page, path);
  await click(page, `level-${seviye}`);
  await click(page, `role-${rol}`);
  await click(page, `goal-${hedef}`);
  await waitFor(page, (s) => !document.querySelector(s)?.disabled, 'start-btn etkin', 5000, sel('start-btn'));
  await click(page, 'start-btn');
}

/** cy.baslaUrl karşılığı: modelin yüklenmesini bekler (?debug=1). */
export async function baslaUrl(page, path, seviye = 'mid', rol = 'dev', hedef = 'learn') {
  await visit(page, path);
  await modelHazir(page);
  await click(page, `level-${seviye}`);
  await click(page, `role-${rol}`);
  await click(page, `goal-${hedef}`);
  await click(page, 'start-btn');
}

/** cy.oyna karşılığı. */
export async function oyna(page, harfler) {
  for (const h of harfler) {
    await click(page, `choice-${h}`);
    await waitVisible(page, 'result-what');
    await click(page, 'next-btn');
  }
}

export const sonP = (page) => page.$eval('[data-cy="p"]', (e) => parseFloat(e.textContent));

export function expect(cond, msg) {
  if (!cond) throw new Error(msg);
}

/** Küçük test koşucusu: her test yeni bir sayfa (izole durum) alır. */
export async function runSuite(name, tests, { only } = {}) {
  const browser = await launch();
  const results = [];
  for (const [title, fn, opts = {}] of tests) {
    if (only && !title.includes(only)) continue;
    const page = await newPage(browser, opts);
    const t0 = Date.now();
    try {
      await fn(page);
      const errs = page.errors.filter((e) => !opts.allowErrors?.some((re) => re.test(e)));
      if (errs.length) throw new Error(`Tarayıcı hataları:\n      ${errs.join('\n      ')}`);
      results.push({ title, ok: true, ms: Date.now() - t0 });
      console.log(`  ✓ ${title} (${Date.now() - t0} ms)`);
    } catch (err) {
      results.push({ title, ok: false, ms: Date.now() - t0, err: err.message });
      console.log(`  ✗ ${title}\n      ${err.message}`);
    }
    await page.close().catch(() => {}); // test sayfayı kendisi kapatmış olabilir
  }
  await browser.close();
  return { name, results };
}
