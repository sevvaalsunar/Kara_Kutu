// app/cypress/e2e/*.cy.js testlerinin birebir portları. Her testin başlığı Cypress'teki başlıkla aynıdır.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  attr, basla, baslaUrl, click, exists, expect, modelHazir, oyna, sleep, sonP, text, tick,
  visit, waitAttr, waitFor, waitGone, waitText, waitVisible, tid,
} from './lib.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const REF = JSON.parse(readFileSync(join(ROOT, 'tests', 'parite.json'), 'utf8'));
const refP = (ad) => REF.referanslar.find((r) => r.ad === ad).beklenen_p;
const FROZEN = { freezeDate: true };

// ------------------------------------------------------------------ yollar.cy.js (v1)
const YOLLAR = [
  { ad: '1A → 2A1 → A', harfler: ['a', 'a', 'a'], son: 'bad', saat: '03:28', neden: 'Kayıtları korudun' },
  { ad: '1A → 2A1 → B', harfler: ['a', 'a', 'b'], son: 'bad', saat: '03:26', neden: 'yetkisiz sabotaj' },
  { ad: '1A → 2A2 → A', harfler: ['a', 'b', 'a'], son: 'bad', saat: '03:28', neden: 'son 6 saatlik tıbbi verisi kayıp' },
  { ad: '1A → 2A2 → B', harfler: ['a', 'b', 'b'], son: 'bad', saat: '03:26', neden: 'tamamen kullanılamaz' },
  { ad: '1B → 2B1 → A', harfler: ['b', 'a', 'a'], son: 'good', saat: '03:28', neden: 'son tarihten 1 dakika önce' },
  { ad: '1B → 2B1 → B', harfler: ['b', 'a', 'b'], son: 'bad', saat: '03:26', neden: 'Doğru yoldaydın' },
  { ad: '1B → 2B2 → A', harfler: ['b', 'b', 'a'], son: 'bad', saat: '03:28', neden: 'iki gün sonra fark edildi' },
  { ad: '1B → 2B2 → B', harfler: ['b', 'b', 'b'], son: 'bad', saat: '03:26', neden: 'fidye yazılımı' },
];

export const yollar = [
  ...YOLLAR.map((y) => [`${y.ad} → ${y.son === 'good' ? 'İYİ' : 'KÖTÜ'} son`, async (p) => {
    await basla(p);
    await oyna(p, y.harfler);
    await waitAttr(p, 'ending', 'data-ending', y.son);
    expect((await text(p, 'ending-reason')).includes(y.neden), `neden metni: ${y.neden}`);
    expect((await text(p, 'game-clock')) === y.saat, `saat ${y.saat}`);
    expect((await p.$$(`${tid('decision-summary')} > div`)).length === 3, 'özet 3 satır');
  }]),
  ['Baştan oyna giriş ekranına döner ve seçimleri sıfırlar', async (p) => {
    await basla(p);
    await oyna(p, ['b', 'a', 'a']);
    await click(p, 'restart-btn');
    expect(await p.$eval(tid('start-btn'), (e) => e.disabled), 'start-btn pasif');
    expect((await text(p, 'game-clock')) === '03:14', 'saat 03:14');
  }],
];

// ------------------------------------------------------------------ kabul.cy.js (v1)
export const kabul = [
  ['KÖ1: Yeni başlayan oyuncuda ipucu kutusu açık gelir, geri sayım yoktur', async (p) => {
    await basla(p, 'new');
    await waitVisible(p, 'hint-box');
    expect((await text(p, 'tutor-reply')).includes('Saldırganı izlemek için açtığın kapıyı saldırgan da görebilir mi?'), 'ilk ipucu');
    expect(!(await exists(p, 'countdown')), 'geri sayım yok');
  }],
  ['KÖ2: Deneyimli oyuncuda süre dolarsa ICU-Net 1A seçer (gerçek 60 sn)', async (p) => {
    await basla(p, 'expert');
    expect((await text(p, 'countdown')).includes('60'), 'sayaç 60');
    await waitVisible(p, 'timeout-note', 75000);
    expect((await text(p, 'timeout-note')) === 'Karar vermedin; ICU-Net senin yerine karar verdi.', 'zaman aşımı notu');
    expect((await text(p, 'result-what')).includes('Truva atı'), '1A sonucu');
  }],
  ['KÖ3: Tek iyi yol 03:28’de iyi sona gider', async (p) => {
    await basla(p);
    await oyna(p, ['b', 'a', 'a']);
    await waitAttr(p, 'ending', 'data-ending', 'good');
    expect((await text(p, 'game-clock')) === '03:28', 'saat');
    expect((await p.$$(`${tid('decision-summary')} > div`)).length === 3, 'özet');
  }],
  ['KÖ4: Doğru yolda son anda kısayol kötü sona gider', async (p) => {
    await basla(p);
    await oyna(p, ['b', 'a', 'b']);
    await waitAttr(p, 'ending', 'data-ending', 'bad');
    expect((await text(p, 'ending-reason')).includes('Doğru yoldaydın'), 'neden');
  }],
  ['KÖ5 (mekanik): Tutor mesajı gönderilir ve cevap gelir', async (p) => {
    await basla(p, 'new');
    await p.type(tid('tutor-input'), 'Hangisini seçmeliyim, sadece söyle');
    await click(p, 'tutor-send');
    await waitFor(p, () => [...document.querySelectorAll('[data-testid="tutor-reply"]')].at(-1)?.textContent.includes('Bu kararın geri alınabilir olup olmadığını nasıl anlarsın?'), 'test modu cevabı');
  }],
  ['Üç soru cevaplanmadan başla butonu pasiftir', async (p) => {
    await visit(p, '/?test=1');
    const disabled = () => p.$eval(tid('start-btn'), (e) => e.disabled);
    expect(await disabled(), 'başta pasif');
    await click(p, 'level-mid');
    await click(p, 'role-sec');
    expect(await disabled(), 'iki cevapla pasif');
    await click(p, 'goal-test');
    expect(!(await disabled()), 'üç cevapla etkin');
  }],
  ['"Biraz deneyimim var": ipucu kapalı gelir, butonla açılır', async (p) => {
    await basla(p, 'mid');
    expect(!(await exists(p, 'hint-box')), 'kapalı');
    await click(p, 'hint-btn');
    await waitVisible(p, 'hint-box');
  }],
  ['"Kavramları öğrenmek" kavram etiketini gösterir', async (p) => {
    await basla(p, 'mid', 'dev', 'learn');
    await click(p, 'choice-b');
    await waitText(p, 'result-concept', /TEST/);
  }],
  ['"Kendimi sınamak" kavram etiketini gizler', async (p) => {
    await basla(p, 'mid', 'dev', 'test');
    await click(p, 'choice-b');
    await waitVisible(p, 'result-what');
    expect(!(await exists(p, 'result-concept')), 'etiket yok');
  }],
  ['Saat kararlarla ilerler ve kalan süreyi gösterir', async (p) => {
    await basla(p);
    expect((await text(p, 'game-clock')) === '03:15', '03:15');
    expect((await text(p, 'time-left')) === '14 dk kaldı', '14 dk');
    await click(p, 'choice-b'); await click(p, 'next-btn');
    expect((await text(p, 'game-clock')) === '03:18', '03:18');
    await click(p, 'choice-a'); await click(p, 'next-btn');
    expect((await text(p, 'game-clock')) === '03:24', '03:24');
    expect((await text(p, 'time-left')) === '5 dk kaldı', '5 dk');
  }],
];

// ------------------------------------------------------------------ adaptif.cy.js (v2.0)
const ADAPT = '/?test=1&debug=1&rollout=on';
const pClose = async (p, ad) => {
  await waitFor(p, () => !isNaN(parseFloat(document.querySelector('[data-cy="p"]')?.textContent)), 'olasılık');
  const got = await sonP(p);
  const want = refP(ad);
  expect(Math.abs(got - want) < 1e-4, `p=${got}, beklenen (Python) ${want}`);
  return got;
};

export const adaptif = [
  ['KÖ6: Zorlanan oyuncu kavram özeti ve sonraki kararda ek destek alır', async (p) => {
    await baslaUrl(p, ADAPT, 'mid');
    expect(!(await exists(p, 'hint-box')), 'ipucu kapalı başlar');
    await tick(p, 40000);
    await click(p, 'hint-btn');
    await click(p, 'choice-a');
    await pClose(p, 'zorlanan_ilk_karar');
    await waitText(p, 'adaptation-applied', /^UYARLANDI$/);
    await waitText(p, 'adaptive-recap', /Kavram özeti/);
    expect((await text(p, 'adaptive-note')).includes('Önceki kararlarına göre'), 'not');
    await click(p, 'next-btn');
    await waitVisible(p, 'hint-box');
    expect(/\?"?$/.test(await text(p, 'adaptive-support')), 'destek soruyla biter');
  }, FROZEN],
  ['KÖ7: Akıcı oyuncu standart akışta kalır', async (p) => {
    await baslaUrl(p, ADAPT, 'mid');
    await tick(p, 3000);
    await click(p, 'choice-b');
    await pClose(p, 'akici_ilk_karar');
    await waitText(p, 'adaptation-applied', /^standart$/);
    expect(!(await exists(p, 'adaptive-recap')), 'özet yok');
    await click(p, 'next-btn');
    expect(!(await exists(p, 'hint-box')), 'ipucu kapalı');
    expect(!(await exists(p, 'adaptive-support')), 'destek yok');
  }, FROZEN],
  ['Destek alan deneyimli oyuncunun sonraki geri sayımı 90 sn olur', async (p) => {
    await baslaUrl(p, ADAPT, 'expert');
    expect((await text(p, 'countdown')).includes('60'), 'K1 60 sn');
    await tick(p, 40000);
    await click(p, 'hint-btn');
    await click(p, 'choice-a');
    await waitVisible(p, 'adaptive-recap');
    await click(p, 'next-btn');
    const c = parseInt(await text(p, 'countdown'), 10);
    expect(c > 60, `sayaç ${c}`);
  }, FROZEN],
  ['Destek soruları seçenek adı veya harfi önermez (§7)', async (p) => {
    await baslaUrl(p, ADAPT, 'mid');
    await tick(p, 40000);
    await click(p, 'hint-btn');
    await click(p, 'choice-a');
    await waitVisible(p, 'adaptive-recap');
    await click(p, 'next-btn');
    const t = await text(p, 'adaptive-support');
    expect(!/\b(A|B)\s*seçeneğ|\b2A1\b|\b2A2\b|Canlıda müdahale|Rollback/i.test(t), `yasak ifade: ${t}`);
  }, FROZEN],
];

// ------------------------------------------------------------------ model.cy.js (v2.0)
export const model = [
  ['Model yüklenir; sürüm ve statü debug panelinde görünür', async (p) => {
    await visit(p, '/?test=1&debug=1');
    await modelHazir(p);
    expect((await text(p, 'model-version')).includes('2.0.0'), 'sürüm');
    expect(/kabul|aday|reddedildi/.test(await text(p, 'model-release-status')), 'statü');
  }],
  ['Kabul edilmemiş model varsayılan olarak yalnızca gölgede çalışır', async (p) => {
    await visit(p, '/?test=1&debug=1');
    await modelHazir(p);
    if ((await text(p, 'model-release-status')) !== 'kabul') await waitAttr(p, 'rollout-mode', 'data-mode', 'shadow');
  }],
  ['Gölge modda olasılık hesaplanır ama oyun değişmez', async (p) => {
    await baslaUrl(p, '/?test=1&debug=1&rollout=shadow', 'mid');
    await tick(p, 40000);
    await click(p, 'hint-btn');
    await click(p, 'choice-a');
    await pClose(p, 'zorlanan_ilk_karar');
    expect((await sonP(p)) > 0.65, 'p > 0.65');
    expect(!(await exists(p, 'adaptive-recap')), 'özet yok');
    await click(p, 'next-btn');
    expect(!(await exists(p, 'adaptive-support')), 'destek yok');
  }, FROZEN],
  ['KÖ8: Model indirilemezse oyun v1 kurallarıyla sonuna kadar oynanır', async (p) => {
    await visit(p, '/?test=1&debug=1&rollout=on&model=bozuk');
    await waitAttr(p, 'model-status', 'data-status', 'devre-disi', 30000);
    expect((await text(p, 'model-error')).includes('indirilemedi'), 'hata mesajı');
    await click(p, 'level-mid'); await click(p, 'role-dev'); await click(p, 'goal-learn');
    await click(p, 'start-btn');
    await oyna(p, ['b', 'a', 'a']);
    await waitAttr(p, 'ending', 'data-ending', 'good');
    expect(!(await exists(p, 'adaptive-recap')), 'uyarlama yok');
  }, { allowErrors: [/404/] }],
  ['?model=off modeli hiç yüklemez', async (p) => {
    await visit(p, '/?test=1&debug=1&model=off');
    await waitAttr(p, 'model-status', 'data-status', 'kapali');
    await waitAttr(p, 'rollout-mode', 'data-mode', 'off');
    await sleep(1500);
    expect((await attr(p, 'model-status', 'data-status')) === 'kapali', 'hâlâ kapalı');
  }],
  ['Aralık dışı özellikle çıkarım reddedilir (sahte olasılık üretilmez)', async (p) => {
    await visit(p, '/?test=1&debug=1');
    await modelHazir(p);
    const bozuk = { ...REF.referanslar[0].girdi, hint_usage_rate: 2 };
    const msg = await p.evaluate(async (f) => {
      try { await window.__KK_MODEL__.predict(f); return 'KABUL EDİLDİ'; } catch (e) { return e.message; }
    }, bozuk);
    expect(msg.includes('hint_usage_rate'), msg);
  }],
];

// ------------------------------------------------------------------ parite.cy.js (v2.0)
export const pariteSonuclari = [];
export const parite = [
  ['5 referans girdinin hepsinde |p_python − p_tarayıcı| < 1e-4', async (p) => {
    await visit(p, '/?test=1&debug=1');
    await modelHazir(p);
    for (const r of REF.referanslar) {
      const got = await p.evaluate((f) => window.__KK_MODEL__.predict(f), r.girdi);
      await waitFor(p, (v) => document.querySelector('[data-cy="p"]')?.textContent === String(v), 'panel p', 5000, got);
      const d = Math.abs(got - r.beklenen_p);
      pariteSonuclari.push({ ad: r.ad, python: r.beklenen_p, tarayici: got, fark: d });
      expect(d < REF.tolerans, `${r.ad}: |${got} − ${r.beklenen_p}| = ${d}`);
    }
  }],
  ['Tarayıcıdaki model dosyası parite.json ile aynı model', async (p) => {
    await visit(p, '/?test=1&debug=1');
    const sha = await p.evaluate(async () => (await (await fetch('/model/config.json')).json()).artifact.sha256);
    expect(sha === REF.model_sha256, `${sha} ≠ ${REF.model_sha256}`);
  }],
];

// ------------------------------------------------------------------ veri.cy.js (v2.0)
export const veri = [
  ['Onay verilmeden nöbet devralınamaz; mod her zaman gölgededir', async (p) => {
    await visit(p, '/?test=1&debug=1&veri=1&rollout=on');
    await click(p, 'level-mid'); await click(p, 'role-dev'); await click(p, 'goal-learn');
    expect(await p.$eval(tid('start-btn'), (e) => e.disabled), 'onaysız pasif');
    await click(p, 'consent');
    expect(!(await p.$eval(tid('start-btn'), (e) => e.disabled)), 'onaylı etkin');
    await waitAttr(p, 'rollout-mode', 'data-mode', 'shadow');
  }],
  ['Son ekranında oturum CSV dışa aktarma düğmesi vardır; normal modda yoktur', async (p) => {
    await visit(p, '/?test=1&veri=1');
    await click(p, 'level-mid'); await click(p, 'role-dev'); await click(p, 'goal-learn');
    await click(p, 'consent');
    await click(p, 'start-btn');
    await oyna(p, ['b', 'a', 'a']);
    await waitVisible(p, 'export-btn');
    await basla(p);
    await oyna(p, ['b', 'a', 'a']);
    await waitVisible(p, 'ending');
    expect(!(await exists(p, 'export-btn')), 'normal modda düğme yok');
  }],
];

// ------------------------------------------------------------------ veri toplama hattı uçtan uca (v2.0)
// Üç TEST katılımcısı ?veri=1&test=1 ile oynar; CSV'ler gerçek tarayıcı indirmesiyle alınır ve Python
// doğrulayıcı + birleştiriciye verilir. Bu oturumlar kaynak=test yazar ve ASLA gerçek oturum sayılmaz.
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, existsSync, copyFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';

async function katilimci(p, dir, { seviye, plan, tekrar }) {
  const cdp = await p.createCDPSession();
  await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: dir });
  await visit(p, '/?test=1&debug=1&veri=1');
  await modelHazir(p);
  for (let oyun = 0; oyun < (tekrar ? 2 : 1); oyun++) {
    await click(p, `level-${seviye}`); await click(p, 'role-ops'); await click(p, 'goal-learn');
    if (oyun === 0) await click(p, 'consent');
    await click(p, 'start-btn');
    for (const [harf, sn, ipucu] of plan) {
      await tick(p, sn * 1000);
      if (ipucu) await click(p, 'hint-btn');
      await click(p, `choice-${harf}`);
      await waitVisible(p, 'result-what');
      await click(p, 'next-btn');
    }
    if (tekrar && oyun === 0) await click(p, 'restart-btn');
  }
  const before = new Set(readdirSync(dir));
  await click(p, 'export-btn');
  await waitFor(p, () => true, '', 100);
  for (let i = 0; i < 50 && readdirSync(dir).filter((f) => f.endsWith('.csv') && !before.has(f)).length === 0; i++) await sleep(100);
  const yeni = readdirSync(dir).filter((f) => f.endsWith('.csv') && !before.has(f));
  expect(yeni.length === 1, `CSV indirilmedi (${yeni})`);
  return join(dir, yeni[0]);
}

export const veriHatti = [
  ['Üç test katılımcısı: CSV indirilir, doğrulanır; birleştirici kaynak=test olduğu için reddeder', async (p) => {
    const dir = mkdtempSync(join(tmpdir(), 'kk-indir-'));
    const dosyalar = [];
    dosyalar.push(await katilimci(p, dir, { seviye: 'new', plan: [['b', 4, false], ['a', 6, false], ['a', 5, false]] }));
    await p.close();
    const p2 = await p.browser().newPage(); await p2.setViewport({ width: 390, height: 844 });
    await p2.evaluateOnNewDocument(() => { const b = Date.now(); let o = 0; Date.now = () => b + o; window.__tick = (ms) => { o += ms; }; });
    dosyalar.push(await katilimci(p2, dir, { seviye: 'mid', plan: [['a', 40, true], ['a', 25, true], ['b', 30, false]], tekrar: true }));
    await p2.close();
    const p3 = await p.browser().newPage(); await p3.setViewport({ width: 390, height: 844 });
    await p3.evaluateOnNewDocument(() => { const b = Date.now(); let o = 0; Date.now = () => b + o; window.__tick = (ms) => { o += ms; }; });
    dosyalar.push(await katilimci(p3, dir, { seviye: 'expert', plan: [['b', 8, false], ['b', 12, true], ['a', 9, false]] }));
    await p3.close();

    for (const f of dosyalar) {
      expect(/kara-kutu-TEST-oturum-[a-z0-9]{12}\.csv$/.test(f), `dosya adı: ${f}`);
      const r = spawnSync('python3', [join(ROOT, 'data', 'validate_dataset.py'), f], { encoding: 'utf8' });
      expect(r.status === 0, `doğrulayıcı: ${r.stdout}`);
      const rows = readFileSync(f, 'utf8').trim().split('\n');
      const h = rows[0].split(',');
      const col = (row, c) => row.split(',')[h.indexOf(c)];
      expect(rows.slice(1).every((row) => col(row, 'kaynak') === 'test'), 'kaynak=test');
      expect(rows.slice(1).every((row) => col(row, 'destek_verildi') === '0'), 'gölge modda destek verilmez');
      expect(rows.slice(1).every((row) => /^0\.\d{6}$|^1\.000000$/.test(col(row, 'model_p'))), 'model_p her satırda dolu (gölge mod)');
    }
    const ikinci = readFileSync(dosyalar[1], 'utf8').trim().split('\n');
    expect(ikinci.length - 1 === 6, `tekrar oynayan katılımcı 6 karar (${ikinci.length - 1})`);

    const gercekDizin = mkdtempSync(join(tmpdir(), 'kk-gercek-'));
    dosyalar.forEach((f) => copyFileSync(f, join(gercekDizin, f.split('/').at(-1))));
    const r = spawnSync('python3', [join(ROOT, 'data', 'birlestir.py'), '--gercek-dizin', gercekDizin,
      '--cikti', join(gercekDizin, 'out.csv'), '--rapor', join(gercekDizin, 'r.md')], { encoding: 'utf8' });
    expect(r.status === 1 && r.stdout.includes('kaynak=test'), `birleştirici test oturumlarını reddetmeli: ${r.stdout}`);
    expect(!existsSync(join(gercekDizin, 'out.csv')), 'reddedilince çıktı yazılmamalı');
    veriHattiSonucu.push(...dosyalar.map((f) => ({ dosya: f.split('/').at(-1), satir: readFileSync(f, 'utf8').trim().split('\n').length - 1 })));
  }, FROZEN],
];
export const veriHattiSonucu = [];

export const SUITES = { yollar, kabul, adaptif, model, parite, veri, veriHatti };
