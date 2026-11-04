// Özellik sözleşmesi testi: TypeScript (tarayıcı) ve Python (data/schema.py) aynı olaylardan
// aynı özellikleri, etiketleri ve CSV satırlarını üretmeli.
// Kullanım: npx tsx scripts/check-features.ts <fixture.json>
import { readFileSync } from 'node:fs';
import { computeFeatures, labelFor, supportEffectiveness, FEATURE_ORDER, DecisionEvent } from '../src/ml/features';
import { SessionLog } from '../src/ml/telemetry';

type Fixture = {
  sessions: { id: string; events: DecisionEvent[]; features: Record<string, number>[]; labels: (0 | 1 | null)[];
              support_eff: number[]; csv_rows: Record<string, string>[] }[];
};

const fx: Fixture = JSON.parse(readFileSync(process.argv[2], 'utf8'));
let checks = 0;
const fails: string[] = [];
for (const s of fx.sessions) {
  const log = new SessionLog(s.id);
  s.events.forEach((e) => log.add(e));
  const rows = log.rows();
  s.events.forEach((_, t) => {
    const f = computeFeatures(s.events, t);
    for (const name of FEATURE_ORDER) {
      checks++;
      if (Math.abs(f[name] - s.features[t][name]) > 1e-9) fails.push(`${s.id}#${t} ${name}: ts=${f[name]} py=${s.features[t][name]}`);
    }
    checks++;
    if (labelFor(s.events, t) !== s.labels[t]) fails.push(`${s.id}#${t} etiket`);
    checks++;
    if (Math.abs(supportEffectiveness(s.events, t) - s.support_eff[t]) > 1e-9) fails.push(`${s.id}#${t} destek etkinliği`);
    for (const [col, py] of Object.entries(s.csv_rows[t])) {
      if (col === 'kaynak') continue; // tarayıcı her zaman "gercek" yazar
      checks++;
      if (String(rows[t][col as keyof (typeof rows)[number]]) !== py) fails.push(`${s.id}#${t} CSV ${col}: ts=${rows[t][col as keyof (typeof rows)[number]]} py=${py}`);
    }
  });
}
if (fails.length) {
  console.error(`GEÇMEDİ: ${fails.length}/${checks} denetim\n  ` + fails.slice(0, 20).join('\n  '));
  process.exit(1);
}
console.log(`GEÇTİ: ${fx.sessions.length} oturum, ${checks} denetim (özellik, etiket, CSV biçimi) TS = Python`);
