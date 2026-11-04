"""Tavan analizi: gizli zorlanma değerini (s) bilen Bayes-optimal tahminci ne kadar başarılı olur?

Sentetik üretici aynı tohumla yeniden çalıştırılır; her etiketli satır için bir sonraki kararın
GERÇEK riskli olma olasılığı (s, sonraki sahne, o sahnedeki önceki deneme sayısı ve seviyeden)
hesaplanır. Bu olasılık hiçbir modelin aşamayacağı üst sınırdır. Sonuç: data/tavan_analizi.json
"""
from __future__ import annotations

import json
import math
import sys
from pathlib import Path

import numpy as np
from sklearn.metrics import balanced_accuracy_score, f1_score, recall_score, roc_auc_score

sys.path.insert(0, str(Path(__file__).resolve().parent))
from generate_synthetic import ALPHABET, DEFAULT_SEED, SCENE_BIAS, simulate_session  # noqa: E402


def p_next_risky(s, level, scene, prior):
    p = 1 / (1 + math.exp(-(-0.4 + 4.0 * (s - 0.5) - 0.7 * prior + SCENE_BIAS[scene])))
    if level == 2:
        pt = 0.03 + 0.20 * s
        p = pt + (1 - pt) * p
    return p


def main(n=400, seed=DEFAULT_SEED, thr=0.65):
    rng = np.random.default_rng(seed)
    y, p = [], []
    for _ in range(n):
        "".join(rng.choice(ALPHABET, 12))  # oturum_id çekimi: generate() ile aynı rng sırası
        events, s = simulate_session(rng, return_latent=True)
        seen = {}
        for t, e in enumerate(events):
            seen[e.sahne_id] = seen.get(e.sahne_id, 0) + 1
            if t + 1 < len(events):
                nxt = events[t + 1]
                y.append(int(nxt.riskli))
                p.append(p_next_risky(s, e.difficulty_level, nxt.sahne_id, seen.get(nxt.sahne_id, 0)))
    y, p = np.array(y), np.array(p)
    res = {"n": int(len(y)), "roc_auc_tavan": round(roc_auc_score(y, p), 4)}
    for name, t in [("esik_0.65", thr), ("en_iyi_esik", None)]:
        if t is None:
            grid = np.linspace(0.05, 0.95, 91)
            t = float(grid[np.argmax([balanced_accuracy_score(y, (p >= g).astype(int)) for g in grid])])
        yh = (p >= t).astype(int)
        res[name] = {"esik": round(t, 2), "balanced_accuracy": round(balanced_accuracy_score(y, yh), 4),
                     "f1": round(f1_score(y, yh), 4), "recall": round(recall_score(y, yh), 4)}
    out = Path(__file__).parent / "tavan_analizi.json"
    out.write_text(json.dumps(res, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(res, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
