/**
 * spec.md §12–§13 özellik ve etiket formülleri.
 * Python referansı: data/schema.py. İkisinin eşitliği
 * tests/integration/test_feature_contract.py ile denetlenir; birini değiştirirsen ötekini de değiştir.
 */

export const FEATURE_ORDER = [
  'decision_time_sec',
  'hesitation_count',
  'wrong_attempts_current_concept',
  'wrong_attempts_recent',
  'hint_usage_rate',
  'retry_count',
  'difficulty_level',
  'concept_mastery_rate',
  'recent_success_rate',
  'branch_risk_score',
  'consecutive_errors',
] as const;

export type FeatureName = (typeof FEATURE_ORDER)[number];
export type FeatureVector = Record<FeatureName, number>;

export const RISKY_CHOICES = new Set(['1A', '2A1', '2B2', 'B']);

export const RISK_SCORE: Record<string, number> = {
  '1A': 1.0, '1B': 0.2,
  '2A1': 1.0, '2A2': 0.8,
  '2B1': 0.1, '2B2': 1.0,
  A: 0.1, B: 1.0,
};

export const CONCEPT_BY_SCENE: Record<string, string> = {
  K1: 'mimari',
  K2_1A: 'veri_test',
  K2_1B: 'veri_test',
  K3: 'guvenlik_kvkk',
};

export const LEVEL_TO_DIFFICULTY: Record<string, number> = { new: 0, mid: 1, expert: 2 };

const MAX_DECISION_TIME = 300;
const TIMEOUT_SECONDS = 60;
const DEFAULT_SUPPORT_EFFECTIVENESS = 0.5;

export interface DecisionEvent {
  sahne_id: string;
  secim_id: string;
  zaman_asimi: boolean;
  decision_time_sec: number;
  hesitation_count: number;
  ipucu_kullandi: boolean;
  oyun_no: number; // 1'den başlar
  difficulty_level: number;
  destek_verildi: boolean;
}

export const isRisky = (e: Pick<DecisionEvent, 'secim_id' | 'zaman_asimi'>) =>
  e.zaman_asimi || RISKY_CHOICES.has(e.secim_id);

/** t. kararın (0 tabanlı) özellikleri; yalnızca events[0..t] kullanılır. */
export function computeFeatures(events: DecisionEvent[], t: number): FeatureVector {
  const hist = events.slice(0, t + 1);
  const e = hist[hist.length - 1];
  const concept = CONCEPT_BY_SCENE[e.sahne_id];
  const same = hist.filter((h) => CONCEPT_BY_SCENE[h.sahne_id] === concept);
  const wrongCc = same.filter(isRisky).length;
  const recent = hist.slice(-3);
  const wrongRecent = recent.filter(isRisky).length;
  let consecutive = 0;
  for (let i = hist.length - 1; i >= 0 && isRisky(hist[i]); i--) consecutive++;
  const time = e.zaman_asimi ? TIMEOUT_SECONDS : e.decision_time_sec;
  return {
    decision_time_sec: Math.min(Math.max(time, 0), MAX_DECISION_TIME),
    hesitation_count: Math.min(e.hesitation_count, 50),
    wrong_attempts_current_concept: Math.min(wrongCc, 20),
    wrong_attempts_recent: wrongRecent,
    hint_usage_rate: hist.filter((h) => h.ipucu_kullandi).length / hist.length,
    retry_count: Math.min(e.oyun_no - 1, 20),
    difficulty_level: e.difficulty_level,
    concept_mastery_rate: 1 - wrongCc / same.length,
    recent_success_rate: 1 - wrongRecent / recent.length,
    branch_risk_score: RISK_SCORE[e.secim_id],
    consecutive_errors: Math.min(consecutive, 20),
  };
}

/** Kaydedilen ama modele girmeyen sütun (spec §13). */
export function supportEffectiveness(events: DecisionEvent[], t: number): number {
  const followers: DecisionEvent[] = [];
  for (let i = 0; i < t; i++) if (events[i].destek_verildi) followers.push(events[i + 1]);
  if (followers.length === 0) return DEFAULT_SUPPORT_EFFECTIVENESS;
  return followers.filter((f) => !isRisky(f)).length / followers.length;
}

/** spec §12: sonraki karar riskli ise 1, değilse 0, yoksa null. */
export function labelFor(events: DecisionEvent[], t: number): 0 | 1 | null {
  if (t + 1 >= events.length) return null;
  return isRisky(events[t + 1]) ? 1 : 0;
}

export function toTensorData(f: FeatureVector, order: readonly string[]): Float32Array {
  return Float32Array.from(order.map((name) => f[name as FeatureName]));
}
