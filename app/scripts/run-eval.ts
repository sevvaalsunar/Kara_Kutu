/**
 * Tutor eval koşucusu.
 * eval/cevaplar.csv'deki 20 mesajı yerel sunucudaki tutor'a gönderir ve yanıtları aynı dosyaya yazar.
 *
 * Kullanım (app klasöründe, sunucu çalışırken):
 *   npx tsx scripts/run-eval.ts 1   -> tur1 sütunlarını doldurur
 *   npx tsx scripts/run-eval.ts 2   -> tur2 sütunlarını doldurur
 *   npx tsx scripts/run-eval.ts 1 9 11 -> yalnızca 9 ve 11 numaralı satırları yeniden koşar
 *
 * Her mesaj, uygulamadaki gibi temiz bir konuşmada gönderilir: geçmişte yalnızca kararın başlangıç ipucu vardır.
 */
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DECISIONS } from '../src/story';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV = path.resolve(__dirname, '../../eval/cevaplar.csv');
const URL = process.env.EVAL_URL || 'http://localhost:3000/api/tutor';
const TUR = process.argv[2] === '2' ? 2 : 1;
const ONLY = process.argv.slice(3);

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((x) => x !== ''));
}

const toCsv = (rows: string[][]) =>
  rows.map((r) => r.map((x) => (/[",\n]/.test(x) ? `"${x.replace(/"/g, '""')}"` : x)).join(',')).join('\n') + '\n';

function decisionFor(karar: string, yol: string) {
  if (karar === '1') return DECISIONS.K1;
  if (karar === '3') return DECISIONS.K3;
  return yol.startsWith('1A') ? DECISIONS.K2_1A : DECISIONS.K2_1B;
}

const rows = parseCsv(readFileSync(CSV, 'utf8'));
const h = rows[0];
const col = (n: string) => h.indexOf(n);
const replyCol = col(`tur${TUR}_tutor_yaniti`);
const notCol = col('not');

for (const r of rows.slice(1)) {
  if (ONLY.length && !ONLY.includes(r[0])) continue;
  const d = decisionFor(r[col('karar')], r[col('yol_kosulu')]);
  const body = {
    decisionId: d.id,
    sceneText: d.sceneText,
    choiceA: { label: d.choiceA.label, description: d.choiceA.description },
    choiceB: { label: d.choiceB.label, description: d.choiceB.description },
    userMessage: r[col('ogrenci_mesaji')],
    history: [{ role: 'model', text: d.initialHint }],
    level: 'mid',
    role: 'dev',
    isTestMode: false,
  };
  const res = await fetch(URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data: any = await res.json();
  r[replyCol] = data.reply ?? '';
  const modelNote = `tur${TUR}: ${data.model ?? 'bilinmiyor'}`;
  const notes = r[notCol].split('; ').filter((x) => x && !x.startsWith(`tur${TUR}:`));
  r[notCol] = [...notes, modelNote].join('; ');
  console.log(`#${r[0]} [${data.model}] ${String(data.reply).slice(0, 90)}`);
  if (data.model === 'fallback') console.warn(`  UYARI: #${r[0]} için Gemini yanıt vermedi, başlangıç ipucu döndü.`);
  await new Promise((ok) => setTimeout(ok, 1500));
}

writeFileSync(CSV, toCsv(rows), 'utf8');
console.log(`\nTamam: ${CSV} dosyasına tur ${TUR} yanıtları yazıldı.`);
