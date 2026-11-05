// v2.0 demo videosu: gerçek uygulama, gerçek Chromium, gerçek ONNX çıkarımı.
// Kayıt: CDP Page.startScreencast kareleri zaman damgalarıyla JPEG olarak yazılır; kodlama (H.264) kayıttan sonra ffmpeg ile yapılır.
// (puppeteer'ın page.screencast'i gerçek zamanlı VP9 kodladığı için yavaş ortamlarda kayıt hızını düşürüyordu.)
// Altyazılar sayfaya enjekte edilen bir katmandır (uygulamanın parçası değildir).
// Kullanım: ./with-server.sh node demo.mjs   → ../../docs/demo/kara-kutu-v2.0-demo.mp4
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, newPage, visit, click, modelHazir, tick, sleep, waitVisible, sonP, text } from './lib.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(HERE, '..', '..', 'docs', 'demo');
const FRAMES = join(tmpdir(), 'kk-demo-kareler');
const MP4 = join(OUT_DIR, 'kara-kutu-v2.0-demo.mp4');
const URL = '/?test=1&debug=1&rollout=on';
mkdirSync(OUT_DIR, { recursive: true });

const log = [];
const t0 = Date.now();
const mark = (s) => { const l = `${((Date.now() - t0) / 1000).toFixed(1).padStart(5)} sn  ${s}`; log.push(l); console.log(l); };

/** CDP ekran yayını: her kare zaman damgasıyla diske yazılır. */
async function startRecorder(page) {
  rmSync(FRAMES, { recursive: true, force: true });
  mkdirSync(FRAMES, { recursive: true });
  const cdp = await page.createCDPSession();
  const frames = [];
  cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
    const f = join(FRAMES, `${String(frames.length).padStart(5, '0')}.jpg`);
    writeFileSync(f, Buffer.from(data, 'base64'));
    frames.push({ f, ts: metadata.timestamp });
    await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 85, maxWidth: 780, maxHeight: 1688, everyNthFrame: 1 });
  return {
    async stop() {
      await cdp.send('Page.stopScreencast');
      await sleep(300);
      return frames;
    },
  };
}

/** Kareleri gerçek zaman damgalarına göre süreli concat listesiyle mp4'e çevirir. */
function encode(frames, endTs) {
  const lines = ['ffconcat version 1.0'];
  frames.forEach((fr, i) => {
    const next = i + 1 < frames.length ? frames[i + 1].ts : endTs;
    lines.push(`file '${fr.f}'`, `duration ${Math.max(next - fr.ts, 0.001).toFixed(4)}`);
  });
  lines.push(`file '${frames.at(-1).f}'`);
  const list = join(FRAMES, 'liste.txt');
  writeFileSync(list, lines.join('\n') + '\n');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list,
    '-vf', 'scale=390:-2:flags=lanczos,fps=30', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '22',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', MP4]);
}

async function caption(page, main, sub = '', tone = 'info') {
  const colors = { info: '#0EA5E9', warn: '#F59E0B', ok: '#22C55E' };
  await page.evaluate((main, sub, c) => {
    let el = document.getElementById('__demo_caption');
    if (!el) {
      el = document.createElement('div');
      el.id = '__demo_caption';
      el.style.cssText = 'position:fixed;left:8px;right:8px;bottom:8px;z-index:9999;pointer-events:none;' +
        'background:rgba(2,6,23,.94);border:1px solid #334155;border-radius:8px;padding:8px 10px;' +
        'font:600 13px/1.35 system-ui,sans-serif;color:#F8FAFC;box-shadow:0 8px 24px rgba(0,0,0,.5)';
      document.body.appendChild(el);
    }
    el.style.borderLeft = `4px solid ${c}`;
    el.innerHTML = `<div>${main}</div>` + (sub ? `<div style="font-weight:400;font-size:11px;color:#CBD5E1;margin-top:3px">${sub}</div>` : '') +
      '<div style="font:500 9px monospace;color:#64748B;margin-top:4px">ALTYAZI · demo katmanı, uygulamanın parçası değildir</div>';
  }, main, sub, colors[tone]);
  mark(`altyazı: ${main.replace(/<[^>]+>/g, '')}`);
}

const DISCLOSURE = 'Model kabul kapılarını GEÇMEDİ (dengeli doğruluk 0.527 &lt; 0.70, yalnızca sentetik veri). ' +
  'Uyarlama burada <b>?rollout=on</b> geliştirici geçersiz kılmasıyla gösteriliyor; üretimde model yalnızca gölgede çalışır.';

const browser = await launch();
const page = await newPage(browser, { freezeDate: true });
await page.setViewport({ width: 390, height: 844 });
await visit(page, URL);
await modelHazir(page);
const recorder = await startRecorder(page);
mark('kayıt başladı');

// --- Açılış
await caption(page, 'KARA KUTU v2.0 · Adaptif Primer', 'Gerçek uygulama · gerçek tarayıcı (Chromium) · gerçek ONNX çıkarımı (onnxruntime-web)');
await sleep(4000);
await caption(page, 'Önemli: bu bir mekanizma gösterimidir', DISCLOSURE + ' Uygulama da bunu oyunun üstündeki “DENEYSEL MOD” şeridiyle gösterir.', 'warn');
await sleep(7000);

// --- Oyuncu A
await caption(page, 'Oyuncu A · “Biraz deneyimim var”', 'Karar 1 ekranına giriyor. Bu seviyede ipucu kutusu normalde kapalı gelir.');
await click(page, 'level-mid'); await sleep(500);
await click(page, 'role-dev'); await sleep(500);
await click(page, 'goal-learn'); await sleep(700);
await click(page, 'start-btn');
await sleep(3500);
await tick(page, 40000);
await caption(page, 'Oyuncu A 40 saniye düşünüyor, ipucunu açıyor…', 'Bekleme süresi kayıtta hızlandırıldı (tarayıcı saati 40 sn ilerletildi).');
await sleep(1500);
await click(page, 'hint-btn');
await sleep(3500);
await caption(page, '…ve riskli seçeneği (A) seçiyor', 'Tarayıcı bu davranıştan 11 özellik hesaplar ve modeli çalıştırır.');
await sleep(2000);
await click(page, 'choice-a');
await waitVisible(page, 'adaptive-recap');
const pA = await sonP(page);
mark(`Oyuncu A olasılığı p = ${pA}`);
await sleep(1500);
await page.$eval('[data-testid="adaptive-recap"]', (e) => e.scrollIntoView({ block: 'center' }));
await caption(page, `Model: p = ${pA.toFixed(3)} ≥ 0.65 → öğrenme desteği`, 'Sonuç ekranına “Kavram özeti” eklendi. Not, neye dayandığını ve bunun bir not/değerlendirme olmadığını söyler.', 'ok');
await sleep(6500);
await click(page, 'next-btn');
await waitVisible(page, 'adaptive-support');
await page.$eval('[data-testid="adaptive-support"]', (e) => e.scrollIntoView({ block: 'center' }));
await caption(page, 'Karar 2: tutor kendiliğinden açıldı', '“Ek destek” sorusu cevabı söylemez, soruyla biter (spec §7). Seviyesi “orta” olsa da destek geldi.', 'ok');
await sleep(6500);

// --- Oyuncu B (aynı sahne, yeni oturum)
await visit(page, URL);
await modelHazir(page);
await caption(page, 'Oyuncu B · aynı sahne, aynı seviye', 'Yeni oturum. Karar 1, Oyuncu A ile birebir aynı.');
await sleep(2500);
await click(page, 'level-mid'); await sleep(400);
await click(page, 'role-dev'); await sleep(400);
await click(page, 'goal-learn'); await sleep(500);
await click(page, 'start-btn');
await sleep(3000);
await tick(page, 3000);
await caption(page, 'Oyuncu B 3 saniyede, ipucusuz B’yi seçiyor', '');
await sleep(2000);
await click(page, 'choice-b');
await waitVisible(page, 'result-why');
await sleep(800);
const pB = await sonP(page);
mark(`Oyuncu B olasılığı p = ${pB}`);
await page.$eval('[data-testid="next-btn"]', (e) => e.scrollIntoView({ block: 'center' }));
await caption(page, `Model: p = ${pB.toFixed(3)} &lt; 0.65 → standart akış`, 'Kavram özeti yok. Uyarlama yalnızca gerektiğinde devreye girer.', 'ok');
await sleep(6000);
await click(page, 'next-btn');
await sleep(1200);
await caption(page, 'Karar 2: ipucu kutusu kapalı (seviyenin varsayılanı)', 'Aynı sahne, farklı davranış → farklı deneyim.');
await sleep(5000);

// --- Geliştirici paneli ve teknik kapanış
await click(page, 'debug-toggle');
await sleep(300);
await page.$eval('[data-testid="debug-panel"]', (e) => e.scrollIntoView({ block: 'end' }));
await sleep(400);
await caption(page, 'Geliştirici paneli (?debug=1)', 'Sürüm 2.0.0 · statü: reddedildi · kol: on (geliştirici geçersiz kılması) · son olasılık ve gecikme', 'warn');
await sleep(7000);
await caption(page, 'Doğrulama', 'Python ↔ tarayıcı paritesi: 5 referans + 34 sınır girdisi < 1e-4 · gerçek tarayıcıda v1 regresyonu 19/19 · ' +
  'model yayınlanmadı: gerçek veri 0/15 ve metrik kapıları geçmedi', 'warn');
await sleep(7000);

const endTs = Date.now() / 1000;
const frames = await recorder.stop();
mark(`kayıt bitti: ${frames.length} kare`);
// CDP zaman damgaları saniye cinsinden duvar saatidir; son karenin süresi kaydın bitişine kadar uzatılır.
const lastTs = Math.max(frames.at(-1).ts, endTs);
await browser.close();
encode(frames, lastTs);
rmSync(FRAMES, { recursive: true, force: true });
const dur = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', MP4], { encoding: 'utf8' }).trim();
mark(`mp4 süresi ${Number(dur).toFixed(1)} sn`);
writeFileSync(join(OUT_DIR, 'kayit-gunlugu.txt'), log.join('\n') + '\n');

