// YEREL SİMÜLASYON (gerçek trafik değildir): canary kovalarının dağılımı ve kol kararlarının önceliği.
// Kullanım: npx tsx scripts/rollout-sim.ts
import { webcrypto } from 'node:crypto';
import { bucketOf, decideRollout } from '../src/ml/rollout';

if (!globalThis.crypto) (globalThis as any).crypto = webcrypto;
const { newSessionId } = await import('../src/ml/telemetry');

const N = 20000;
const ids = Array.from({ length: N }, () => newSessionId());
let failed = false;
for (const pct of [5, 25, 50, 100]) {
  const on = ids.filter((id) =>
    decideRollout({ params: new URLSearchParams(), sessionId: id, releaseStatus: 'kabul', configMode: 'canary', canaryPercent: pct }).mode === 'on',
  ).length;
  const share = (100 * on) / N;
  const ok = Math.abs(share - pct) < 1.0;
  failed ||= !ok;
  console.log(`canary %${pct}: ${on}/${N} oturum uyarlama kolunda (%${share.toFixed(2)}) ${ok ? 'GEÇTİ' : 'GEÇMEDİ'}`);
}
// Aynı oturum her zaman aynı kova (kararlılık)
const stable = ids.slice(0, 1000).every((id) => bucketOf(id) === bucketOf(id));
console.log(`kova kararlılığı: ${stable ? 'GEÇTİ' : 'GEÇMEDİ'}`);
const cases: [string, Parameters<typeof decideRollout>[0], string][] = [
  ['reddedilmiş model → gölge', { params: new URLSearchParams(), sessionId: 'x', releaseStatus: 'reddedildi', configMode: 'on', canaryPercent: 100 }, 'shadow'],
  ['aday model → gölge', { params: new URLSearchParams(), sessionId: 'x', releaseStatus: 'aday', configMode: 'on', canaryPercent: 100 }, 'shadow'],
  ['veri modu her zaman gölge', { params: new URLSearchParams('veri=1&rollout=on'), sessionId: 'x', releaseStatus: 'kabul', configMode: 'on', canaryPercent: 100 }, 'shadow'],
  ['?model=off → kapalı', { params: new URLSearchParams('model=off&rollout=on'), sessionId: 'x', releaseStatus: 'kabul', configMode: 'on', canaryPercent: 100 }, 'off'],
  ['geliştirici geçersiz kılması', { params: new URLSearchParams('rollout=on'), sessionId: 'x', releaseStatus: 'reddedildi', configMode: 'shadow', canaryPercent: 0 }, 'on'],
  ['kabul + config on → açık', { params: new URLSearchParams(), sessionId: 'x', releaseStatus: 'kabul', configMode: 'on', canaryPercent: 100 }, 'on'],
];
for (const [name, input, want] of cases) {
  const got = decideRollout(input).mode;
  failed ||= got !== want;
  console.log(`${name}: ${got} ${got === want ? 'GEÇTİ' : `GEÇMEDİ (beklenen ${want})`}`);
}
process.exit(failed || !stable ? 1 : 0);
