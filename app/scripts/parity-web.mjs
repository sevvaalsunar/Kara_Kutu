// Diferansiyel parite: onnxruntime-web (WASM, tarayıcıdakiyle aynı paket ve sürüm) Node üzerinde
// tests/parite.json'daki 5 referans girdiyi çalıştırır ve Python Oracle ile karşılaştırır.
// Not: Bu bir tarayıcı değildir; gerçek tarayıcı paritesi cypress/e2e/parite.cy.js ile ölçülür.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as ort from 'onnxruntime-web/wasm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const files = ['parite.json', 'parite_sinir.json'];
const ref = JSON.parse(readFileSync(join(root, 'tests', files[0]), 'utf8'));
const bytes = readFileSync(join(root, ref.model_dosyasi));
const sha = createHash('sha256').update(bytes).digest('hex');
if (sha !== ref.model_sha256) {
  console.error(`Model özeti parite.json ile uyuşmuyor (${sha.slice(0, 12)} ≠ ${ref.model_sha256.slice(0, 12)})`);
  process.exit(1);
}
ort.env.wasm.numThreads = 1;
const session = await ort.InferenceSession.create(new Uint8Array(bytes));
let worst = 0;
let n = 0;
for (const name of files) {
  const doc = JSON.parse(readFileSync(join(root, 'tests', name), 'utf8'));
  if (doc.model_sha256 !== sha) { console.error(`${name} başka bir modelden üretilmiş`); process.exit(1); }
  for (const r of doc.referanslar) {
    const data = Float32Array.from(doc.feature_order.map((f) => r.girdi[f]));
    const out = await session.run({ features: new ort.Tensor('float32', data, [1, data.length]) });
    const p = out.probabilities.data[1];
    const d = Math.abs(p - r.beklenen_p);
    worst = Math.max(worst, d);
    n++;
    if (name === files[0]) console.log(`${r.ad.padEnd(28)} python ${r.beklenen_p.toFixed(7)}  ort-web ${p.toFixed(7)}  |fark| ${d.toExponential(2)}`);
  }
}
const ok = worst < ref.tolerans;
console.log(`${ok ? 'GEÇTİ' : 'GEÇMEDİ'}: ${n} girdi (5 referans + sınır kümesi), en büyük fark ${worst.toExponential(2)} (tolerans ${ref.tolerans}), onnxruntime-web ${ort.env.versions.web}`);
process.exit(ok ? 0 : 1);
