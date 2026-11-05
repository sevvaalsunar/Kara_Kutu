// Gerçek tarayıcıda bir TEST oturumu oynayıp CSV'sini data/sablon/ORNEK_test_oturumu.csv olarak kaydeder.
// Bu dosya kaynak=test'tir; gerçek veri değildir ve birleştirici tarafından reddedilir.
import { copyFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, newPage } from './lib.mjs';
import { katilimci } from './specs.mjs';

const dest = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'data', 'sablon', 'ORNEK_test_oturumu.csv');
const b = await launch();
const p = await newPage(b, { freezeDate: true });
const f = await katilimci(p, mkdtempSync(join(tmpdir(), 'kk-ornek-')), {
  seviye: 'mid', plan: [['a', 40, true], ['a', 25, true], ['b', 30, false]], tekrar: true,
});
copyFileSync(f, dest);
console.log(`${f} → ${dest}`);
await b.close();
