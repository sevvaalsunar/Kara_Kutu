/**
 * Dağıtım kolu kararı (spec.md §14, §15; RELEASE.md "Güvenli dağıtım").
 *
 * Öncelik sırası:
 * 1. ?model=off            → kapalı (model hiç yüklenmez)
 * 2. ?veri=1               → gölge (veri toplama etiketleri müdahaleyle kirlenmesin)
 * 3. ?rollout=on|shadow    → geliştirici geçersiz kılması (debug panelinde "geçersiz kılındı" görünür)
 * 4. statü ≠ kabul         → gölge (aday ve reddedilmiş model oyunu değiştiremez)
 * 5. config.rollout        → off | shadow | on | canary (canary: oturum kimliğinin kovası < yüzde)
 */
export type RolloutMode = 'off' | 'shadow' | 'on';

export interface RolloutDecision {
  mode: RolloutMode;
  reason: string;
  bucket: number;
  overridden: boolean;
}

/** FNV-1a 32 bit; oturum kimliğini 0–99 arası kararlı bir kovaya eşler. */
export function bucketOf(sessionId: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < sessionId.length; i++) {
    h ^= sessionId.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h % 100;
}

export interface RolloutInputs {
  params: URLSearchParams;
  sessionId: string;
  releaseStatus: 'kabul' | 'aday' | 'reddedildi' | null;
  configMode: 'off' | 'shadow' | 'canary' | 'on' | null;
  canaryPercent: number;
}

export function decideRollout(i: RolloutInputs): RolloutDecision {
  const bucket = bucketOf(i.sessionId);
  const base = { bucket, overridden: false };
  if (i.params.get('model') === 'off') return { ...base, mode: 'off', reason: '?model=off' };
  if (i.params.get('veri') === '1') return { ...base, mode: 'shadow', reason: 'veri toplama modu (gölge)' };
  const ov = i.params.get('rollout');
  if (ov === 'on' || ov === 'shadow')
    return { mode: ov, reason: `?rollout=${ov} (geliştirici geçersiz kılması)`, bucket, overridden: true };
  if (i.releaseStatus && i.releaseStatus !== 'kabul')
    return { ...base, mode: 'shadow', reason: `model statüsü "${i.releaseStatus}": yalnızca gölge` };
  switch (i.configMode) {
    case 'on':
      return { ...base, mode: 'on', reason: 'config: on' };
    case 'canary':
      return bucket < i.canaryPercent
        ? { ...base, mode: 'on', reason: `canary: kova ${bucket} < %${i.canaryPercent}` }
        : { ...base, mode: 'shadow', reason: `canary dışı: kova ${bucket} ≥ %${i.canaryPercent}` };
    case 'shadow':
      return { ...base, mode: 'shadow', reason: 'config: shadow' };
    default:
      return { ...base, mode: 'off', reason: 'config: off' };
  }
}
