"""Python Oracle: aynı model.onnx'i onnxruntime ile çalıştırıp 5 referans girdinin olasılığını üretir.

Kullanım:
    python tests/parite.py --uret     # tests/parite.json'u modelden yeniden üretir
    python tests/parite.py            # parite.json'daki beklenen değerleri modelle karşılaştırır
    python tests/parite.py --model model/gelistirme/model.onnx --config model/gelistirme/config.json

Beklenen olasılıklar elle yazılmaz; her zaman gerçek ONNX modelinden üretilir.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

import numpy as np
import onnxruntime as ort

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(__file__).with_name("parite.json")
TOLERANS = 1e-4

# Belgelenmiş 5 referans girdi (spec.md §13 sırası ve birimleri). Değerler oyunda oluşabilecek durumlardır.
REFERANSLAR = [
    {"ad": "akici_ilk_karar",
     "aciklama": "K1, Biraz deneyimim var; 3 sn'de, tereddütsüz, ipucusuz 1B seçti (spec §20 KÖ7).",
     "girdi": {"decision_time_sec": 3, "hesitation_count": 0, "wrong_attempts_current_concept": 0,
               "wrong_attempts_recent": 0, "hint_usage_rate": 0, "retry_count": 0, "difficulty_level": 1,
               "concept_mastery_rate": 1, "recent_success_rate": 1, "branch_risk_score": 0.2, "consecutive_errors": 0}},
    {"ad": "zorlanan_ilk_karar",
     "aciklama": "K1, Biraz deneyimim var; 40 sn bekledi, ipucunu açtı (1 tereddüt), 1A seçti (spec §20 KÖ6).",
     "girdi": {"decision_time_sec": 40, "hesitation_count": 1, "wrong_attempts_current_concept": 1,
               "wrong_attempts_recent": 1, "hint_usage_rate": 1, "retry_count": 0, "difficulty_level": 1,
               "concept_mastery_rate": 0, "recent_success_rate": 0, "branch_risk_score": 1.0, "consecutive_errors": 1}},
    {"ad": "ikinci_oyunda_toparlanan",
     "aciklama": "2. oyun K2_1B, Yeni başladım; ilk oyunda 2 riskli seçim, şimdi 12 sn'de 2B1 seçti.",
     "girdi": {"decision_time_sec": 12, "hesitation_count": 2, "wrong_attempts_current_concept": 1,
               "wrong_attempts_recent": 1, "hint_usage_rate": 0.6, "retry_count": 1, "difficulty_level": 0,
               "concept_mastery_rate": 0.5, "recent_success_rate": 0.6666667, "branch_risk_score": 0.1, "consecutive_errors": 0}},
    {"ad": "deneyimli_zaman_asimi",
     "aciklama": "K3, Deneyimliyim; süre doldu (60 sn), üç kararın üçü de riskli.",
     "girdi": {"decision_time_sec": 60, "hesitation_count": 4, "wrong_attempts_current_concept": 1,
               "wrong_attempts_recent": 3, "hint_usage_rate": 0, "retry_count": 0, "difficulty_level": 2,
               "concept_mastery_rate": 0, "recent_success_rate": 0, "branch_risk_score": 1.0, "consecutive_errors": 3}},
    {"ad": "uc_deger",
     "aciklama": "Aralık sınırı: tüm sayaçlar üst sınırda (sözleşme sınır testi).",
     "girdi": {"decision_time_sec": 300, "hesitation_count": 50, "wrong_attempts_current_concept": 20,
               "wrong_attempts_recent": 3, "hint_usage_rate": 1, "retry_count": 20, "difficulty_level": 2,
               "concept_mastery_rate": 0, "recent_success_rate": 0, "branch_risk_score": 1.0, "consecutive_errors": 20}},
]


def predict(model_path: Path, order: list[str], inputs: list[dict]) -> list[float]:
    sess = ort.InferenceSession(str(model_path), providers=["CPUExecutionProvider"])
    X = np.array([[r[f] for f in order] for r in inputs], dtype=np.float32)
    return [float(p) for p in sess.run(["probabilities"], {"features": X})[0][:, 1]]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default=str(ROOT / "model" / "model.onnx"))
    ap.add_argument("--config", default=None)
    ap.add_argument("--uret", action="store_true")
    a = ap.parse_args()
    model = Path(a.model).resolve()
    cfg_path = Path(a.config) if a.config else model.with_name("config.json")
    if not model.exists():
        print(f"Model bulunamadı: {model}. Kabul edilmiş model yoksa --model model/gelistirme/model.onnx kullanın.")
        return 2
    cfg = json.loads(cfg_path.read_text(encoding="utf-8"))
    order = cfg["input"]["feature_order"]
    sha = hashlib.sha256(model.read_bytes()).hexdigest()
    probs = predict(model, order, [r["girdi"] for r in REFERANSLAR])

    if a.uret:
        doc = {
            "model_version": cfg["model_version"],
            "release_status": cfg["release_status"],
            "model_sha256": sha,
            "model_dosyasi": str(model.relative_to(ROOT)),
            "feature_order": order,
            "output_semantics": cfg["output"]["semantics"],
            "support_threshold": cfg["support_threshold"],
            "tolerans": TOLERANS,
            "uretici": f"onnxruntime {ort.__version__} (Python)",
            "referanslar": [{**r, "beklenen_p": p, "destek": p >= cfg["support_threshold"]}
                            for r, p in zip(REFERANSLAR, probs)],
        }
        OUT.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        for r, p in zip(REFERANSLAR, probs):
            print(f"{r['ad']:<28} p = {p:.7f}  {'DESTEK' if p >= cfg['support_threshold'] else 'standart'}")
        print(f"→ {OUT}")
        return 0

    doc = json.loads(OUT.read_text(encoding="utf-8"))
    if doc["model_sha256"] != sha:
        print(f"UYARI: parite.json başka bir modelden üretilmiş ({doc['model_sha256'][:12]} ≠ {sha[:12]}).")
        return 1
    worst = 0.0
    for ref, p in zip(doc["referanslar"], probs):
        d = abs(ref["beklenen_p"] - p)
        worst = max(worst, d)
        print(f"{ref['ad']:<28} beklenen {ref['beklenen_p']:.7f}  bulunan {p:.7f}  |fark| {d:.2e}")
    ok = worst < doc["tolerans"]
    print(("GEÇTİ" if ok else "GEÇMEDİ") + f": en büyük fark {worst:.2e} (tolerans {doc['tolerans']})")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
