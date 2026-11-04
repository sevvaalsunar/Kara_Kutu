// Kullanım: node run.mjs [suite ...]   (uygulama BASE_URL'de çalışıyor olmalı; varsayılan http://localhost:3000)
// Sonuçlar: sonuclar.json
import { writeFileSync } from 'node:fs';
import { SUITES, pariteSonuclari } from './specs.mjs';
import { runSuite } from './lib.mjs';

const names = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const only = process.argv.find((a) => a.startsWith('--only='))?.slice(7);
const selected = names.length ? names : Object.keys(SUITES);
const all = [];
for (const n of selected) {
  console.log(`\n${n}`);
  all.push(await runSuite(n, SUITES[n], { only }));
}
const flat = all.flatMap((s) => s.results.map((r) => ({ suite: s.name, ...r })));
const passed = flat.filter((r) => r.ok).length;
const out = { tarih: new Date().toISOString(), tarayici: process.env.CHROME_PATH ?? '@sparticuz/chromium', gecen: passed, toplam: flat.length, sonuclar: flat, parite: pariteSonuclari };
writeFileSync(new URL('./sonuclar.json', import.meta.url), JSON.stringify(out, null, 2) + '\n');
console.log(`\n${passed}/${flat.length} test geçti`);
process.exit(passed === flat.length ? 0 : 1);
