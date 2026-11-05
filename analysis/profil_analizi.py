"""Profil bazlı hata analizi ve aşırı uyum denetimi (yalnızca TEŞHİS; model, eşik ve kapılar değişmez).
Çıktı: analysis/profil_analizi.json. Tüm veriler SENTETİKTİR."""
from __future__ import annotations

import json
import sys
import warnings
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.metrics import balanced_accuracy_score, roc_auc_score

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT)); sys.path.insert(0, str(ROOT / "data"))
warnings.filterwarnings("ignore")
import train  # noqa: E402
from schema import FEATURES, LABEL  # noqa: E402

S = json.loads((ROOT / "model" / "egitim_ayarlari.json").read_text())
THR = S["support_threshold"]
df, _ = train.load_dataset(ROOT / "data" / "oturumlar.csv", S["bolme"]["kat"])
raw = pd.read_csv(ROOT / "data" / "oturumlar.csv", dtype=str, keep_default_na=False)
df = df.join(raw[["sahne_id", "secim_id", "zaman_asimi"]].rename(columns=lambda c: c + "_r"), how="left")
tr, te = train.split(df, S)
pipe = train.build_model(S).fit(df.iloc[tr][FEATURES].to_numpy(np.float32), df.iloc[tr][LABEL])
R = {}

def ozet(d):
    y = d[LABEL].to_numpy(); p = pipe.predict_proba(d[FEATURES].to_numpy(np.float32))[:, 1]; yh = (p >= THR).astype(int)
    pos = y == 1
    return {"n": int(len(d)), "pozitif_oran": round(float(y.mean()), 3), "ort_p": round(float(p.mean()), 3),
            "destek_orani": round(float(yh.mean()), 3),
            "kacirilan_destek_FN_orani": round(float((yh[pos] == 0).mean()), 3) if pos.any() else None,
            "gereksiz_destek_FP_orani": round(float((yh[~pos] == 1).mean()), 3) if (~pos).any() else None,
            "ba": round(float(balanced_accuracy_score(y, yh)), 3) if len(set(y)) == 2 else None}

# Aşırı uyum: eğitim ve test farkı
R["asiri_uyum"] = {}
for ad, idx in (("egitim", tr), ("test", te)):
    d = df.iloc[idx]; p = pipe.predict_proba(d[FEATURES].to_numpy(np.float32))[:, 1]
    R["asiri_uyum"][ad] = {"auc": round(float(roc_auc_score(d[LABEL], p)), 4), **ozet(d)}

t = df.iloc[te]
seg = {
    "seviye=Yeni başladım": t.difficulty_level == 0, "seviye=Biraz deneyimim var": t.difficulty_level == 1,
    "seviye=Deneyimliyim": t.difficulty_level == 2,
    "ilk oyun": t.retry_count == 0, "tekrar oyun (retry ≥ 1)": t.retry_count >= 1,
    "bu karar riskli": t.branch_risk_score >= 0.8, "bu karar güvenli": t.branch_risk_score < 0.8,
    "karar süresi < 15 sn": t.decision_time_sec < 15, "karar süresi ≥ 30 sn": t.decision_time_sec >= 30,
    "ipucu hiç kullanılmadı": t.hint_usage_rate == 0, "ipucu her kararda": t.hint_usage_rate == 1,
    "ardışık hata ≥ 2": t.consecutive_errors >= 2, "zaman aşımı": t.zaman_asimi_r == "1",
}
R["profil_segmentleri_test"] = {k: ozet(t[m]) for k, m in seg.items() if m.sum() >= 10}
R["orneklem"] = {"seviye_dagilimi": df.difficulty_level.value_counts(normalize=True).round(3).sort_index().to_dict(),
                 "oturum_basina_karar_ort": round(float(raw.groupby("oturum_id").size().mean()), 2),
                 "test_oturum": int(t.oturum_id.nunique()), "test_satir": int(len(t))}
out = ROOT / "analysis" / "profil_analizi.json"
out.write_text(json.dumps(R, ensure_ascii=False, indent=2, default=float) + "\n", encoding="utf-8")
print(json.dumps(R["asiri_uyum"], ensure_ascii=False))
for k, v in R["profil_segmentleri_test"].items(): print(f"{k:<28} n={v['n']:<4} poz={v['pozitif_oran']:<6} ort_p={v['ort_p']:<6} destek={v['destek_orani']:<6} FN={v['kacirilan_destek_FN_orani']} FP={v['gereksiz_destek_FP_orani']}")
print(R["orneklem"])
