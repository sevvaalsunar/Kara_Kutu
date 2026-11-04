"""Kök neden analizi (yalnızca TEŞHİS). Yayın verisini, eşiği veya kapıları DEĞİŞTİRMEZ.

Çıktı: analysis/kok_neden_sonuclari.json  (docs/MODEL_ROOT_CAUSE_ANALYSIS.md bu sayılara dayanır)

Bilinçli olarak YAPILMAYAN: alternatif hedef tanımlarının metriklerini ölçmek. spec.md §12'ye göre
hedef değişikliği, yeni etiketler değerlendirilmeden önce ön kayıt gerektirir.
"""
from __future__ import annotations

import json
import sys
import warnings
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import balanced_accuracy_score, f1_score, recall_score, roc_auc_score

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT)); sys.path.insert(0, str(ROOT / "data"))
warnings.filterwarnings("ignore")
import train  # noqa: E402
from generate_synthetic import generate  # noqa: E402
from schema import FEATURES, LABEL  # noqa: E402

SETTINGS = json.loads((ROOT / "model" / "egitim_ayarlari.json").read_text())
THR = SETTINGS["support_threshold"]
R = {}


def labeled(rows):
    df = pd.DataFrame(rows)
    df = df[df[LABEL] != ""].copy()
    df[LABEL] = df[LABEL].astype(int)
    for c in FEATURES:
        df[c] = df[c].astype(float)
    return df


def m(y, p, thr=THR):
    yh = (p >= thr).astype(int)
    return {"ba": round(balanced_accuracy_score(y, yh), 4), "f1": round(f1_score(y, yh, zero_division=0), 4),
            "recall": round(recall_score(y, yh, zero_division=0), 4), "auc": round(roc_auc_score(y, p), 4),
            "pozitif_tahmin_orani": round(float(yh.mean()), 4)}


# 1) Yayın verisi ve yayın bölmesi
df, info = train.load_dataset(ROOT / "data" / "oturumlar.csv", SETTINGS["bolme"]["kat"])
tr, te = train.split(df, SETTINGS)
d_tr, d_te = df.iloc[tr], df.iloc[te]
pipe = train.build_model(SETTINGS).fit(d_tr[FEATURES].to_numpy(np.float32), d_tr[LABEL])
p_te = pipe.predict_proba(d_te[FEATURES].to_numpy(np.float32))[:, 1]
y_te = d_te[LABEL].to_numpy()
R["yayin_test"] = m(y_te, p_te)

# 2) Etiket dağılımı: bir sonraki sahneye göre
nxt = []
for sid, g in pd.read_csv(ROOT / "data" / "oturumlar.csv", dtype=str, keep_default_na=False).groupby("oturum_id", sort=False):
    g = g.sort_values("karar_id", key=lambda c: c.astype(int))
    sc = g["sahne_id"].tolist()
    lab = g[LABEL].tolist()
    nxt += [(sc[i + 1], int(lab[i])) for i in range(len(sc) - 1)]
nx = pd.DataFrame(nxt, columns=["sonraki_sahne", "y"])
R["etiket_dagilimi"] = {"pozitif_oran": round(float(df[LABEL].mean()), 4), "n": int(len(df)),
                        "sonraki_sahneye_gore": {k: {"n": int(len(v)), "pozitif_oran": round(float(v.y.mean()), 4)}
                                                 for k, v in nx.groupby("sonraki_sahne")}}

# 3) Özellik ayrıştırıcılığı: etikete göre ortalama ve standartlaştırılmış fark (Cohen d)
fd = {}
for c in FEATURES:
    a, b = df.loc[df[LABEL] == 0, c], df.loc[df[LABEL] == 1, c]
    sp = np.sqrt((a.var() + b.var()) / 2) or 1.0
    fd[c] = {"ort_0": round(float(a.mean()), 3), "ort_1": round(float(b.mean()), 3), "cohen_d": round(float((b.mean() - a.mean()) / sp), 3)}
R["ozellik_ayristiriciligi"] = fd

# 4) Olasılık dağılımı ve eşik: model 0.65'in üstüne ne sıklıkla çıkıyor?
R["olasilik_dagilimi_test"] = {q: round(float(np.quantile(p_te, float(q))), 4) for q in ["0.1", "0.25", "0.5", "0.75", "0.9"]}
R["olasilik_dagilimi_test"]["p>=0.65_orani"] = round(float((p_te >= THR).mean()), 4)
R["esik_teshisi_KAPI_DEGIL"] = {f"{t:.2f}": m(y_te, p_te, t) for t in (0.40, 0.50, 0.55, 0.60, 0.65)}

# 5) Değerlendirme kararlılığı: test kümesinde oturum bazlı önyükleme (bootstrap) güven aralığı
rng = np.random.default_rng(0)
sess = d_te["oturum_id"].to_numpy()
uniq = np.unique(sess)
idx_by = {s: np.where(sess == s)[0] for s in uniq}
bas = []
for _ in range(1000):
    pick = np.concatenate([idx_by[s] for s in rng.choice(uniq, len(uniq))])
    if len(set(y_te[pick])) == 2:
        bas.append(balanced_accuracy_score(y_te[pick], (p_te[pick] >= THR).astype(int)))
R["test_ba_bootstrap_95"] = [round(float(np.quantile(bas, 0.025)), 4), round(float(np.quantile(bas, 0.975)), 4)]

# 6) Veri miktarı: aynı üreticiden daha çok sentetik oturum yardım eder mi? (bağımsız büyük test kümesi)
big_test = labeled(generate(5000, 777))
Xbt, ybt = big_test[FEATURES].to_numpy(np.float32), big_test[LABEL].to_numpy()
curve = {}
for n in (400, 1600, 6400):
    d = labeled(generate(n, 20261104 + n))
    pp = train.build_model(SETTINGS).fit(d[FEATURES].to_numpy(np.float32), d[LABEL])
    curve[str(n)] = m(ybt, pp.predict_proba(Xbt)[:, 1])
R["ogrenme_egrisi_bagimsiz_test"] = curve

# 7) Model sınıfı: daha esnek bir model tavanı aşar mı?
d = labeled(generate(6400, 20267800))
hgb = HistGradientBoostingClassifier(random_state=0, class_weight="balanced").fit(d[FEATURES], d[LABEL])
R["model_sinifi_bagimsiz_test"] = {"lojistik_6400": curve["6400"], "gradient_boosting_6400": m(ybt, hgb.predict_proba(big_test[FEATURES])[:, 1])}

# 8) Bayes tavanı (data/tavan_analizi.json)
R["bayes_tavani"] = json.loads((ROOT / "data" / "tavan_analizi.json").read_text())

out = ROOT / "analysis" / "kok_neden_sonuclari.json"
out.write_text(json.dumps(R, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps(R, ensure_ascii=False, indent=1))
