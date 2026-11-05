// Senaryo tabanlı UX turu: gerçek uygulama, gerçek Chromium, gerçek model. Üç profil + kenar durumları.
// Her kilit ekranda ekran görüntüsü ve otomatik erişilebilirlik ölçümü alınır → docs/ux/
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, newPage, visit, click, modelHazir, tick, sleep, waitVisible, sonP } from './lib.mjs';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'docs', 'ux');
const bulgular = [];

async function olc(p, ekran) {
  const r = await p.evaluate(() => {
    const vis = (e) => { const s = getComputedStyle(e); const b = e.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && b.width > 0 && b.height > 0; };
    const kucukHedef = [...document.querySelectorAll('button, input, a, [role=button], label')].filter(vis)
      .map((e) => ({ e, b: e.getBoundingClientRect() })).filter(({ b }) => b.height < 44 || b.width < 44)
      .map(({ e, b }) => `${e.dataset.testid || e.tagName.toLowerCase()}:${Math.round(b.width)}×${Math.round(b.height)}`);
    const kucukMetin = new Set();
    for (const e of document.querySelectorAll('body *')) {
      if (!vis(e) || ![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
      const fs = parseFloat(getComputedStyle(e).fontSize);
      if (fs < 11) kucukMetin.add(`${fs}px:"${e.textContent.trim().slice(0, 28)}"`);
    }
    const adsiz = [...document.querySelectorAll('button')].filter(vis).filter((b) => !b.textContent.trim() && !b.getAttribute('aria-label')).map((b) => b.dataset.testid || b.outerHTML.slice(0, 60));
    return { kucukHedef, kucukMetin: [...kucukMetin].slice(0, 12), kucukMetinSayisi: kucukMetin.size, adsiz,
             yatayTasma: document.documentElement.scrollWidth > window.innerWidth, sayfaYuksekligi: document.documentElement.scrollHeight };
  });
  bulgular.push({ ekran, ...r });
}
async function shot(p, ad, full = true) { await sleep(400); await p.screenshot({ path: join(OUT, 'ekranlar', `${ad}.png`), fullPage: full }); await olc(p, ad); }

const b = await launch();
const kayit = [];
// Profil 1: hızlı, ipucu kullanmayan (Deneyimliyim)
{ const p = await newPage(b, { freezeDate: true });
  await visit(p, '/?test=1&debug=1&rollout=on'); await modelHazir(p);
  await shot(p, '01-giris');
  await click(p, 'level-expert'); await click(p, 'role-dev'); await click(p, 'goal-test'); await click(p, 'start-btn');
  await shot(p, '02-karar1-deneyimli');
  await tick(p, 6000); await click(p, 'choice-b'); await waitVisible(p, 'result-what');
  kayit.push({ profil: 'P1 hızlı', karar: 'K1→1B', p: await sonP(p) });
  await shot(p, '03-sonuc-hizli');
  await click(p, 'next-btn'); await tick(p, 8000); await click(p, 'choice-a'); await waitVisible(p, 'result-what');
  kayit.push({ profil: 'P1 hızlı', karar: 'K2_1B→2B1', p: await sonP(p) });
  await click(p, 'next-btn'); await tick(p, 7000); await click(p, 'choice-a'); await waitVisible(p, 'result-what');
  kayit.push({ profil: 'P1 hızlı', karar: 'K3→A', p: await sonP(p) });
  await click(p, 'next-btn'); await waitVisible(p, 'ending');
  await shot(p, '04-son-iyi'); await p.close(); }
// Profil 2: uzun düşünen, ipucu ve tutor kullanan (Yeni başladım) — doğru seçimler
{ const p = await newPage(b, { freezeDate: true });
  await visit(p, '/?test=1&debug=1&rollout=on'); await modelHazir(p);
  await click(p, 'level-new'); await click(p, 'role-sec'); await click(p, 'goal-learn'); await click(p, 'start-btn');
  await tick(p, 45000);
  await p.type('[data-testid="tutor-input"]', 'Ağı kesersem hangi hastalar etkilenir?'); await click(p, 'tutor-send');
  await sleep(600); await shot(p, '05-karar1-yeni-tutor');
  await click(p, 'choice-b'); await waitVisible(p, 'result-what');
  kayit.push({ profil: 'P2 düşünen', karar: 'K1→1B (45 sn, tutor)', p: await sonP(p) });
  await shot(p, '06-sonuc-dusunen');
  await click(p, 'next-btn'); await tick(p, 50000); await click(p, 'choice-a'); await waitVisible(p, 'result-what');
  kayit.push({ profil: 'P2 düşünen', karar: 'K2_1B→2B1 (50 sn)', p: await sonP(p) });
  await p.close(); }
// Profil 3: zorlanan, riskli seçen (Biraz deneyimim var)
{ const p = await newPage(b, { freezeDate: true });
  await visit(p, '/?test=1&debug=1&rollout=on'); await modelHazir(p);
  await click(p, 'level-mid'); await click(p, 'role-ops'); await click(p, 'goal-learn'); await click(p, 'start-btn');
  await tick(p, 40000); await click(p, 'hint-btn'); await click(p, 'choice-a'); await waitVisible(p, 'result-what');
  kayit.push({ profil: 'P3 zorlanan', karar: 'K1→1A (40 sn, ipucu)', p: await sonP(p) });
  await shot(p, '07-sonuc-zorlanan-ozet');
  await click(p, 'next-btn'); await waitVisible(p, 'adaptive-support');
  await shot(p, '08-karar2-ek-destek');
  await tick(p, 30000); await click(p, 'choice-a'); await waitVisible(p, 'result-what');
  kayit.push({ profil: 'P3 zorlanan', karar: 'K2_1A→2A1 (30 sn)', p: await sonP(p) });
  await click(p, 'next-btn'); await tick(p, 20000); await click(p, 'choice-b'); await waitVisible(p, 'result-what');
  kayit.push({ profil: 'P3 zorlanan', karar: 'K3→B (20 sn)', p: await sonP(p) });
  await click(p, 'next-btn'); await waitVisible(p, 'ending');
  await shot(p, '09-son-kotu');
  await click(p, 'debug-toggle'); await shot(p, '10-debug-acik', false);
  await p.close(); }
// Kenar durumları
{ const p = await newPage(b); await visit(p, '/?veri=1&debug=1'); await sleep(1500); await shot(p, '11-veri-modu-onay');
  await p.close(); }
{ const p = await newPage(b); await p.setViewport({ width: 360, height: 740 });
  await visit(p, '/?test=1&model=bozuk&debug=1'); await sleep(1500);
  await click(p, 'level-mid'); await click(p, 'role-dev'); await click(p, 'goal-learn'); await click(p, 'start-btn');
  await shot(p, '12-360px-model-yok'); await p.close(); }
{ const p = await newPage(b); await visit(p, '/'); await sleep(1500); await shot(p, '13-normal-kullanici-giris', false);
  bulgular.push({ ekran: 'normal kullanıcı (parametresiz)', debugPaneliVar: !!(await p.$('[data-testid="debug-panel"]')) });
  await p.close(); }
await b.close();
writeFileSync(join(OUT, 'olcumler.json'), JSON.stringify({ olasiliklar: kayit, ekranlar: bulgular }, null, 2) + '\n');
console.log(JSON.stringify(kayit, null, 1));
for (const x of bulgular) console.log(x.ekran, '| küçük hedef:', x.kucukHedef?.length, x.kucukHedef?.slice(0,6).join(' '), '| <11px metin:', x.kucukMetinSayisi, '| adsız:', x.adsiz?.length, '| taşma:', x.yatayTasma);
