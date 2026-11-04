/**
 * Anonim oturum kaydı (spec.md §15, data/SOZLUK.md).
 * Yalnızca bellekte tutulur; sunucuya gönderilmez, tarayıcı depolamasına yazılmaz.
 * Kişisel veri yok: ad, e-posta, cihaz kimliği, IP, konum ve tutor mesaj metni kaydedilmez.
 */
import {
  CONCEPT_BY_SCENE, DecisionEvent, computeFeatures, isRisky, labelFor, supportEffectiveness,
} from './features';

export const CSV_COLUMNS = [
  'oturum_id', 'karar_id', 'oyun_no', 'sahne_id', 'concept_id', 'secim_id', 'riskli', 'zaman_asimi',
  'decision_time_sec', 'hesitation_count', 'wrong_attempts_current_concept', 'wrong_attempts_recent',
  'hint_usage_rate', 'decision_change_count', 'retry_count', 'difficulty_level', 'concept_mastery_rate',
  'recent_success_rate', 'branch_risk_score', 'consecutive_errors', 'previous_support_effectiveness',
  'destek_verildi', 'model_p', 'needs_learning_support', 'kaynak',
] as const;

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

export function newSessionId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}

export class SessionLog {
  readonly id: string;
  readonly events: DecisionEvent[] = [];
  readonly modelP: (number | null)[] = [];

  constructor(id: string = newSessionId()) {
    this.id = id;
  }

  /** Kararı ekler ve indeksini döndürür. */
  add(e: DecisionEvent): number {
    this.events.push(e);
    this.modelP.push(null);
    return this.events.length - 1;
  }

  setModelP(index: number, p: number) {
    this.modelP[index] = p;
  }

  rows(): Record<(typeof CSV_COLUMNS)[number], string | number>[] {
    return this.events.map((e, t) => {
      const f = computeFeatures(this.events, t);
      const label = labelFor(this.events, t);
      const p = this.modelP[t];
      return {
        oturum_id: this.id,
        karar_id: t + 1,
        oyun_no: e.oyun_no,
        sahne_id: e.sahne_id,
        concept_id: CONCEPT_BY_SCENE[e.sahne_id],
        secim_id: e.secim_id,
        riskli: isRisky(e) ? 1 : 0,
        zaman_asimi: e.zaman_asimi ? 1 : 0,
        ...Object.fromEntries(Object.entries(f).map(([k, v]) => [k, fmt(v)])),
        decision_change_count: 0,
        previous_support_effectiveness: fmt(supportEffectiveness(this.events, t)),
        destek_verildi: e.destek_verildi ? 1 : 0,
        model_p: p === null ? '' : p.toFixed(6),
        needs_learning_support: label === null ? '' : label,
        kaynak: 'gercek',
      } as Record<(typeof CSV_COLUMNS)[number], string | number>;
    });
  }

  toCsv(): string {
    const lines = [CSV_COLUMNS.join(',')];
    for (const r of this.rows()) lines.push(CSV_COLUMNS.map((c) => String(r[c])).join(','));
    return lines.join('\n') + '\n';
  }

  download() {
    const blob = new Blob([this.toCsv()], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `kara-kutu-oturum-${this.id}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
}

/** Python'daki f"{v:.6g}" ile aynı biçim (6 anlamlı basamak, sondaki sıfırlar yok). */
export function fmt(v: number): string {
  if (Number.isInteger(v)) return String(v);
  return String(Number(v.toPrecision(6)));
}
