"""KARA KUTU v2.0 eğitim hattı (spec.md §12–§17).

Kullanım:
    python train.py                 # kabul edilebilir sürüm üretmeye çalışır
    python train.py --aday          # gerçek veri kapısı geçmezse modeli ADAY olarak yazar

Çıkış kodları:
    0  tüm kapılar geçti, model KABUL statüsünde yazıldı
    1  veri geçersiz veya metrik/sızıntı/parite kapısı geçmedi; hiçbir dosya yazılmadı
    2  yalnızca gerçek veri kapısı geçmedi; --aday verilmediği için dosya yazılmadı
    3  yalnızca gerçek veri kapısı geçmedi; --aday ile ADAY model yazıldı (yayınlanamaz)
    4  kabul edilmiş bir sürümün üzerine aday yazılmak istendi; reddedildi

--gelistirme: metrik kapıları geçmese bile yapıtları model/gelistirme/ altına REDDEDİLDİ
statüsüyle yazar (çıkış kodu yine 1). Bu yapıtlar yalnızca entegrasyon testi ve gölge mod
içindir; yayın betiği ve uygulama bunları kabul edilmiş model gibi kullanmaz.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import onnx
import onnxruntime as ort
import pandas as pd
import sklearn
import skl2onnx
from jsonschema import validate as js_validate
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    balanced_accuracy_score, confusion_matrix, f1_score, precision_score,
    recall_score, roc_auc_score,
)
from sklearn.model_selection import StratifiedGroupKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "data"))
from schema import FEATURE_SPECS, FEATURES, LABEL  # noqa: E402
from validate_dataset import load_csv, validate  # noqa: E402

SETTINGS_PATH = ROOT / "model" / "egitim_ayarlari.json"
SCHEMA_PATH = ROOT / "model" / "config.schema.json"
STATUS_NOTE = {
    "kabul": "Tüm kabul kapıları geçti.",
    "aday": "Metrik kapıları geçti ama gerçek veri kapısı geçmedi; yayınlanmamalıdır.",
    "reddedildi": "Metrik kabul kapıları GEÇMEDİ. Bu yapıt yalnızca entegrasyon testi ve gölge mod içindir; yayınlanmamalı ve oyunu değiştirmemelidir.",
}
ARTIFACTS = ["model.onnx", "config.json", "metrics.json", "model_version.json", "README.md"]


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def log(msg: str) -> None:
    print(msg, flush=True)


# ---------------------------------------------------------------- veri
def load_dataset(path: Path, n_folds: int) -> tuple[pd.DataFrame, dict]:
    if not path.exists():
        log(f"VERİ YOK: {path} bulunamadı. Önce `python data/birlestir.py` çalıştırın.")
        sys.exit(1)
    raw = load_csv(path)
    errs = validate(raw)
    if not errs and (raw["kaynak"] == "test").any():
        errs = ["kaynak=test satırları (doğrulama oturumları) eğitime giremez"]
    if errs:
        log("VERİ GEÇERSİZ:\n  - " + "\n  - ".join(errs))
        sys.exit(1)
    df = raw.copy()
    for c in FEATURES:
        df[c] = df[c].astype(np.float32)
    labeled = df[df[LABEL] != ""].copy()
    labeled[LABEL] = labeled[LABEL].astype(int)
    # Değerlendirme kurulabilir mi? Her sınıf, en az kat sayısı kadar farklı oturumda bulunmalı.
    for cls in (0, 1):
        n_sess = labeled.loc[labeled[LABEL] == cls, "oturum_id"].nunique()
        if n_sess < n_folds:
            log(f"VERİ YETERSİZ: sınıf {cls} yalnızca {n_sess} oturumda var; gruplu {n_folds} katlı "
                f"değerlendirme kurulamaz. Kapılar değerlendirilemedi, model yazılmadı.")
            sys.exit(1)
    info = {
        "toplam_satir": int(len(df)),
        "etiketli_satir": int(len(labeled)),
        "etiketsiz_satir (oturumun son kararı)": int(len(df) - len(labeled)),
        "gercek_oturum": int(df.loc[df.kaynak == "gercek", "oturum_id"].nunique()),
        "sentetik_oturum": int(df.loc[df.kaynak == "sentetik", "oturum_id"].nunique()),
        "gercek_etiketli_satir": int((labeled.kaynak == "gercek").sum()),
        "sentetik_etiketli_satir": int((labeled.kaynak == "sentetik").sum()),
        "pozitif_oran": round(float(labeled[LABEL].mean()), 4),
        "veri_seti_surumu": sha256(path)[:12],
    }
    return labeled, info


def split(df: pd.DataFrame, settings: dict) -> tuple[np.ndarray, np.ndarray]:
    b = settings["bolme"]
    sgkf = StratifiedGroupKFold(n_splits=b["kat"], shuffle=True, random_state=settings["tohum"])
    folds = list(sgkf.split(df[FEATURES], df[LABEL], groups=df["oturum_id"]))
    tr, te = folds[b["test_kati"]]
    overlap = set(df.iloc[tr]["oturum_id"]) & set(df.iloc[te]["oturum_id"])
    if overlap:
        raise AssertionError(f"Grup sızıntısı: {len(overlap)} oturum hem eğitimde hem testte")
    return tr, te


def build_model(settings: dict) -> Pipeline:
    m = settings["model"]
    return Pipeline([
        ("scaler", StandardScaler()),
        ("clf", LogisticRegression(C=m["C"], class_weight=m["class_weight"],
                                   max_iter=m["max_iter"], random_state=settings["tohum"])),
    ])


def metrics_at(y: np.ndarray, p: np.ndarray, thr: float) -> dict:
    yhat = (p >= thr).astype(int)
    tn, fp, fn, tp = confusion_matrix(y, yhat, labels=[0, 1]).ravel()
    return {
        "esik": thr,
        "balanced_accuracy": round(float(balanced_accuracy_score(y, yhat)), 4),
        "f1": round(float(f1_score(y, yhat, zero_division=0)), 4),
        "recall": round(float(recall_score(y, yhat, zero_division=0)), 4),
        "precision": round(float(precision_score(y, yhat, zero_division=0)), 4),
        "roc_auc": round(float(roc_auc_score(y, p)), 4) if len(set(y)) == 2 else None,
        "karisiklik_matrisi": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
        "n": int(len(y)),
        "pozitif": int(y.sum()),
    }


def single_feature_auc(df: pd.DataFrame) -> dict:
    out = {}
    y = df[LABEL].to_numpy()
    for c in FEATURES:
        x = df[c].to_numpy()
        a = roc_auc_score(y, x) if np.ptp(x) > 0 else 0.5
        out[c] = round(float(max(a, 1 - a)), 4)
    return out


# ---------------------------------------------------------------- onnx
def export_onnx(pipe: Pipeline, settings: dict, path: Path) -> None:
    onx = convert_sklearn(
        pipe,
        initial_types=[("features", FloatTensorType([None, len(FEATURES)]))],
        options={id(pipe.named_steps["clf"]): {"zipmap": False}},
        target_opset={"": settings["onnx"]["opset"], "ai.onnx.ml": settings["onnx"]["ml_opset"]},
    )
    onx.graph.name = f"{settings['model_adi']}_{settings['model_surumu']}"  # skl2onnx rastgele UUID koyar; tekrarlanabilirlik için sabitlenir
    onx.doc_string = f"{settings['model_adi']} {settings['model_surumu']}; girdi sırası: {','.join(FEATURES)}"
    onnx.checker.check_model(onx)
    path.write_bytes(onx.SerializeToString())


def onnx_parity(pipe: Pipeline, path: Path, X_test: np.ndarray, seed: int) -> dict:
    rng = np.random.default_rng(seed)
    lo = np.array([FEATURE_SPECS[f]["min"] for f in FEATURES], dtype=np.float32)
    hi = np.array([FEATURE_SPECS[f]["max"] for f in FEATURES], dtype=np.float32)
    X_rand = (lo + rng.random((2000, len(FEATURES))) * (hi - lo)).astype(np.float32)
    X = np.vstack([X_test.astype(np.float32), X_rand])
    sess = ort.InferenceSession(str(path), providers=["CPUExecutionProvider"])
    out_names = [o.name for o in sess.get_outputs()]
    p_onnx = sess.run(["probabilities"], {"features": X})[0][:, 1]
    p_skl = pipe.predict_proba(X)[:, 1]
    diff = np.abs(p_onnx.astype(np.float64) - p_skl)
    return {"n": int(len(X)), "max_abs_fark": float(diff.max()), "ortalama_abs_fark": float(diff.mean()),
            "ciktilar": out_names}


# ---------------------------------------------------------------- belgeler
def build_config(settings, info, metrics, pipe, onnx_sha) -> dict:
    clf = pipe.named_steps["clf"]
    return {
        "model_name": settings["model_adi"],
        "model_version": settings["model_surumu"],
        "release_tag": settings["yayin_etiketi"],
        "model_type": "sklearn Pipeline(StandardScaler, LogisticRegression) → ONNX",
        "input": {
            "tensor_name": "features",
            "dtype": "float32",
            "shape": [None, len(FEATURES)],
            "feature_order": FEATURES,
            "features": {f: {**FEATURE_SPECS[f], "required": True} for f in FEATURES},
            "defaults": None,
            "missing_policy": "Eksik veya aralık dışı özellik varsa çıkarım yapılmaz (spec.md §18).",
        },
        "output": {
            "tensor_name": "probabilities",
            "shape": [None, 2],
            "class_labels": [0, 1],
            "positive_index": 1,
            "semantics": "P(needs_learning_support = 1): oyuncunun bir sonraki kararında riskli seçeneği seçme olasılığı (spec.md §12).",
        },
        "support_threshold": settings["support_threshold"],
        "evaluation": metrics["test"],
        "random_seed": settings["tohum"],
        "dataset_version": info["veri_seti_surumu"],
        "onnx_opset": {"ai.onnx": settings["onnx"]["opset"], "ai.onnx.ml": settings["onnx"]["ml_opset"]},
        "runtime": {"browser": "onnxruntime-web 1.30.0 (wasm)", "python": f"onnxruntime {ort.__version__}"},
        "artifact": {"file": "model.onnx", "sha256": onnx_sha},
        "source": {"hf_repo": None, "hf_commit": None, "pinned_url": None},
        "rollout": {"mode": "on", "canary_percent": 100,
                    "_not": "Gerçek trafik yok; sınıf demosu %100. Plan RELEASE.md'de."},
        "coefficients_for_audit": {
            "scaler_mean": [round(float(v), 6) for v in pipe.named_steps["scaler"].mean_],
            "scaler_scale": [round(float(v), 6) for v in pipe.named_steps["scaler"].scale_],
            "coef": [round(float(v), 6) for v in clf.coef_[0]],
            "intercept": round(float(clf.intercept_[0]), 6),
        },
    }


def model_card(cfg, info, metrics, version_meta) -> str:
    t = metrics["test"]
    cm = t["karisiklik_matrisi"]
    status = version_meta["release_status"]
    coef_rows = "\n".join(
        f"| `{f}` | {c:+.3f} |" for f, c in
        sorted(zip(FEATURES, cfg["coefficients_for_audit"]["coef"]), key=lambda x: -abs(x[1])))
    gates = "\n".join(f"| {k} | {'GEÇTİ' if v['gecti'] else 'GEÇMEDİ'} | {v['deger']} | {v['kosul']} |"
                      for k, v in metrics["kapilar"].items())
    return f"""---
license: apache-2.0
library_name: onnx
tags: [tabular-classification, education, onnx, sklearn]
---

# {cfg['model_name']} · v{cfg['model_version']}

> Statü: **{status.upper()}**. {STATUS_NOTE[status]}

KARA KUTU (YZM301 SE Primer) oyununda, oyuncunun bir sonraki kararında riskli seçeneği seçme olasılığını tahmin eden küçük bir lojistik regresyon modeli. Olasılık {cfg['support_threshold']} eşiğini geçerse oyun ek açıklama ve tutor desteği sunar (spec.md §14).

## Amaç ve kapsam

- **Amaç:** Oyun içinde zorlanma işaretlerine göre öğrenme desteğini artırmak.
- **Hedef kullanıcı:** KARA KUTU oyuncuları (yazılım mühendisliği öğrencileri) ve oyunu geliştirenler.
- **Kapsam dışı:** Not verme, öğrenci değerlendirme, işe alım, zekâ/kişilik/ruh sağlığı çıkarımı, oyun dışı her kullanım. Model bir kişinin yeteneğini ölçmez; yalnızca bu oyundaki bir sonraki seçimi tahmin eder.

## Veri

| | Değer |
|---|---|
| Veri seti sürümü | `{info['veri_seti_surumu']}` |
| Gerçek oturum | {info['gercek_oturum']} |
| Sentetik oturum | {info['sentetik_oturum']} |
| Etiketli satır (gerçek / sentetik) | {info['gercek_etiketli_satir']} / {info['sentetik_etiketli_satir']} |
| Pozitif oran | {info['pozitif_oran']} |

Sentetik veri `data/generate_synthetic.py` (tohum {cfg['random_seed']}) ile, belgelenmiş varsayımlara göre üretildi. **Sentetik veri gerçek oyuncu davranışının yerine geçmez;** buradaki metrikler, modelin üreticinin varsaydığı ilişkileri ne kadar geri kazandığını gösterir, gerçek oyunculardaki başarıyı değil.

Etiket: aynı oturumdaki bir sonraki karar riskli ise 1 (spec.md §12).

## Eğitim

`StandardScaler` + `LogisticRegression(C=1.0, class_weight="balanced")`, scikit-learn {sklearn.__version__}. Bölme: oturum gruplu, katmanlı 5 kat; ilk kat test. ONNX: skl2onnx {skl2onnx.__version__}, opset {cfg['onnx_opset']['ai.onnx']} / ml {cfg['onnx_opset']['ai.onnx.ml']}.

## Değerlendirme (test kümesi, eşik {t['esik']})

| Metrik | Değer |
|---|---|
| Dengeli doğruluk | {t['balanced_accuracy']} |
| F1 | {t['f1']} |
| Recall (destek) | {t['recall']} |
| Precision | {t['precision']} |
| ROC-AUC | {t['roc_auc']} |
| Karışıklık matrisi | TN {cm['tn']} · FP {cm['fp']} · FN {cm['fn']} · TP {cm['tp']} |
| Çapraz doğrulama (eğitim, 4 kat) dengeli doğruluk | {metrics['capraz_dogrulama']['balanced_accuracy_ort']} ± {metrics['capraz_dogrulama']['balanced_accuracy_std']} |

### Kabul kapıları

| Kapı | Sonuç | Değer | Koşul |
|---|---|---|---|
{gates}

### Katsayılar (standartlaştırılmış özellikler)

| Özellik | Katsayı |
|---|---|
{coef_rows}

## Sınırlamalar ve bilinen hata durumları

- Gerçek veri yokken metrikler yalnızca sentetik üretici varsayımlarını yansıtır.
- Oturum başına ortalama 4–5 karar vardır; ilk kararda geçmiş yoktur, tahmin büyük ölçüde süre, tereddüt ve seçimin riskine dayanır.
- Tereddüt sayısı fareyle ölçülür; dokunmatik ekranda kart üzerinde gezinme olmadığı için düşük kalır. Aynı davranış telefonda daha düşük olasılık üretebilir.
- Uyarlama verilen oyuncuların sonraki seçimleri müdahaleden etkilenir; bu yüzden veri toplama modu gölge modda çalışır (spec.md §15).
- Uzun süre başka sekmede kalmak karar süresini yapay olarak artırır ve yanlış pozitif üretebilir.

## Gizlilik ve etik

Girdi yalnızca oyun içi sayısal olaylardır. Ad, e-posta, cihaz kimliği, IP, konum ve serbest metin toplanmaz. Çıkarım tarayıcıda yapılır; oyuncu verisi cihazdan çıkmaz. Model kişiler hakkında karar vermek için kullanılmamalıdır.

## Sürüm geçmişi

| Sürüm | Not |
|---|---|
| 2.0.0 | İlk adaptif sürüm (`{status}`), veri `{info['veri_seti_surumu']}` |
"""


# ---------------------------------------------------------------- ana akış
def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--veri", default=str(ROOT / "data" / "oturumlar.csv"))
    ap.add_argument("--cikti", default=str(ROOT / "model"))
    ap.add_argument("--aday", action="store_true", help="Gerçek veri kapısı geçmezse ADAY model yaz")
    ap.add_argument("--gelistirme", action="store_true",
                    help="Kapı geçmezse yapıtları model/gelistirme/ altına REDDEDİLDİ statüsüyle yaz")
    a = ap.parse_args()

    settings = json.loads(SETTINGS_PATH.read_text(encoding="utf-8"))
    out_dir = Path(a.cikti)
    gates_cfg = settings["kapilar"]
    thr = settings["support_threshold"]
    seed = settings["tohum"]
    np.random.seed(seed)

    log("1/7 Veri yükleniyor ve doğrulanıyor")
    df, info = load_dataset(Path(a.veri), settings["bolme"]["kat"])
    log(f"    {info}")

    log("2/7 Oturum gruplu bölme")
    tr, te = split(df, settings)
    d_tr, d_te = df.iloc[tr], df.iloc[te]
    X_tr, y_tr = d_tr[FEATURES].to_numpy(np.float32), d_tr[LABEL].to_numpy()
    X_te, y_te = d_te[FEATURES].to_numpy(np.float32), d_te[LABEL].to_numpy()
    log(f"    eğitim {len(d_tr)} satır / {d_tr.oturum_id.nunique()} oturum; "
        f"test {len(d_te)} satır / {d_te.oturum_id.nunique()} oturum")

    log("3/7 Çapraz doğrulama (yalnızca eğitim kümesi)")
    cv_ba = []
    inner = StratifiedGroupKFold(n_splits=4, shuffle=True, random_state=seed)
    for itr, iva in inner.split(X_tr, y_tr, groups=d_tr["oturum_id"]):
        m = build_model(settings).fit(X_tr[itr], y_tr[itr])
        cv_ba.append(balanced_accuracy_score(y_tr[iva], (m.predict_proba(X_tr[iva])[:, 1] >= thr).astype(int)))

    log("4/7 Eğitim ve test değerlendirmesi")
    pipe = build_model(settings).fit(X_tr, y_tr)
    test_m = metrics_at(y_te, pipe.predict_proba(X_te)[:, 1], thr)
    real_te = (d_te.kaynak == "gercek").to_numpy()
    real_m = metrics_at(y_te[real_te], pipe.predict_proba(X_te[real_te])[:, 1], thr) if real_te.sum() >= 2 and len(set(y_te[real_te])) == 2 else None
    sfa = single_feature_auc(d_tr)
    log(f"    test: {test_m}")

    staging = out_dir / ".staging"
    shutil.rmtree(staging, ignore_errors=True)
    staging.mkdir(parents=True)

    log("5/7 ONNX'e aktarım ve parite")
    onnx_path = staging / "model.onnx"
    export_onnx(pipe, settings, onnx_path)
    parity = onnx_parity(pipe, onnx_path, X_te, seed)
    log(f"    parite: max |fark| = {parity['max_abs_fark']:.3e} (n={parity['n']})")

    gates = {
        "balanced_accuracy": {"deger": test_m["balanced_accuracy"], "kosul": f">= {gates_cfg['balanced_accuracy_min']}",
                              "gecti": test_m["balanced_accuracy"] >= gates_cfg["balanced_accuracy_min"]},
        "f1": {"deger": test_m["f1"], "kosul": f">= {gates_cfg['f1_min']}", "gecti": test_m["f1"] >= gates_cfg["f1_min"]},
        "recall": {"deger": test_m["recall"], "kosul": f">= {gates_cfg['recall_min']}",
                   "gecti": test_m["recall"] >= gates_cfg["recall_min"]},
        "sizinti_grup": {"deger": "ayrık", "kosul": "eğitim/test oturumları ayrık", "gecti": True},
        "sizinti_tek_ozellik": {"deger": max(sfa.values()), "kosul": f"<= {gates_cfg['tek_ozellik_auc_max']}",
                                "gecti": max(sfa.values()) <= gates_cfg["tek_ozellik_auc_max"]},
        "veri_gecerliligi": {"deger": "geçerli", "kosul": "eksik/aralık dışı satır yok", "gecti": True},
        "onnx_parite": {"deger": float(f"{parity['max_abs_fark']:.3e}"), "kosul": f"< {gates_cfg['onnx_parite_max']}",
                        "gecti": parity["max_abs_fark"] < gates_cfg["onnx_parite_max"]},
        "gercek_veri": {"deger": info["gercek_oturum"], "kosul": f">= {gates_cfg['gercek_oturum_min']} gerçek oturum",
                        "gecti": info["gercek_oturum"] >= gates_cfg["gercek_oturum_min"]},
    }
    metrics = {
        "test": test_m,
        "test_yalnizca_gercek": real_m,
        "capraz_dogrulama": {"balanced_accuracy_ort": round(float(np.mean(cv_ba)), 4),
                             "balanced_accuracy_std": round(float(np.std(cv_ba)), 4), "kat": 4},
        "tek_ozellik_auc": sfa,
        "onnx_parite": parity,
        "kapilar": gates,
        "veri": info,
    }

    log("6/7 Kapılar")
    for k, v in gates.items():
        log(f"    {'GEÇTİ ' if v['gecti'] else 'GEÇMEDİ'} {k}: {v['deger']} ({v['kosul']})")
    hard_fail = [k for k, v in gates.items() if not v["gecti"] and k != "gercek_veri"]
    real_fail = not gates["gercek_veri"]["gecti"]
    ctx = dict(settings=settings, info=info, metrics=metrics, pipe=pipe, staging=staging, seed=seed)
    if hard_fail:
        if a.gelistirme:
            dest = out_dir / "gelistirme"
            write_artifacts(dest=dest, status="reddedildi", **ctx)
            log(f"SONUÇ: Kapı(lar) geçmedi: {hard_fail}. Yayın yapıtı YAZILMADI; "
                f"yalnızca entegrasyon için {dest} altına REDDEDİLDİ statüsüyle yazıldı.")
        else:
            shutil.rmtree(staging, ignore_errors=True)
            log(f"SONUÇ: Kapı(lar) geçmedi: {hard_fail}. Hiçbir dosya yazılmadı.")
        return 1
    if real_fail and not a.aday:
        shutil.rmtree(staging, ignore_errors=True)
        log("SONUÇ: Gerçek veri kapısı geçmedi. ADAY model için --aday kullanın. Hiçbir dosya yazılmadı.")
        return 2
    status = "aday" if real_fail else "kabul"

    prev = out_dir / "model_version.json"
    if status == "aday" and prev.exists():
        if json.loads(prev.read_text(encoding="utf-8")).get("release_status") == "kabul":
            shutil.rmtree(staging, ignore_errors=True)
            log("SONUÇ: Kabul edilmiş sürümün üzerine aday yazılamaz.")
            return 4

    write_artifacts(dest=out_dir, status=status, **ctx)
    if status == "aday":
        log("SONUÇ: Metrik kapıları geçti; gerçek veri kapısı GEÇMEDİ. Model ADAY olarak yazıldı (yayınlanamaz).")
        return 3
    log("SONUÇ: Tüm kapılar geçti. Model KABUL statüsünde yazıldı.")
    return 0


def write_artifacts(dest: Path, status: str, settings, info, metrics, pipe, staging: Path, seed: int) -> None:
    log(f"7/7 Yapıtlar yazılıyor → {dest} ({status})")
    dest.mkdir(parents=True, exist_ok=True)
    onnx_sha = sha256(staging / "model.onnx")
    cfg = build_config(settings, info, metrics, pipe, onnx_sha)
    cfg["release_status"] = status
    if status != "kabul":
        cfg["rollout"] = {"mode": "shadow", "canary_percent": 0,
                          "_not": f"Statü '{status}': oyunu değiştiremez, yalnızca gölge modda çalışır."}
    js_validate(cfg, json.loads(SCHEMA_PATH.read_text(encoding="utf-8")))
    version_meta = {
        "model_version": settings["model_surumu"],
        "release_tag": settings["yayin_etiketi"],
        "release_status": status,
        "previous_version": "1.x (modelsiz, kural tabanlı)",
        "dataset_version": info["veri_seti_surumu"],
        "onnx_sha256": onnx_sha,
        "random_seed": seed,
        "libraries": {"python": sys.version.split()[0], "scikit-learn": sklearn.__version__,
                      "skl2onnx": skl2onnx.__version__, "onnx": onnx.__version__,
                      "onnxruntime": ort.__version__, "numpy": np.__version__, "pandas": pd.__version__},
        "hf": {"repo": None, "commit": None, "pinned_url": None},
    }
    (staging / "config.json").write_text(json.dumps(cfg, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (staging / "metrics.json").write_text(json.dumps(metrics, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (staging / "model_version.json").write_text(json.dumps(version_meta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (staging / "README.md").write_text(model_card(cfg, info, metrics, version_meta), encoding="utf-8")
    for name in ARTIFACTS:
        shutil.move(str(staging / name), str(dest / name))
    staging.rmdir()


if __name__ == "__main__":
    sys.exit(main())
