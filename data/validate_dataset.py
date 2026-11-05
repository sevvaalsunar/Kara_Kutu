"""oturumlar.csv doğrulayıcı (spec.md §13, §15; data/SOZLUK.md).

Kullanım:
    python data/validate_dataset.py data/oturumlar.csv [diğer.csv ...]
Hata varsa her hatayı yazar ve 1 ile çıkar.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent))
from schema import (  # noqa: E402
    CONCEPT_BY_SCENE, CSV_COLUMNS, FEATURE_SPECS, FEATURES, FORBIDDEN_COLUMNS,
    LABEL, LOGGED_ONLY, RISK_SCORE, RISKY_CHOICES, CHOICES_BY_SCENE, SOURCES,
)

SESSION_RE = re.compile(r"^[a-z0-9]{12}$")
MAX_ERRORS_PER_CHECK = 5


def load_csv(path: str | Path) -> pd.DataFrame:
    return pd.read_csv(path, dtype=str, keep_default_na=False)


def validate(df: pd.DataFrame) -> list[str]:
    """Tüm hataları döndürür; boş liste = geçerli."""
    errors: list[str] = []

    cols = [c.strip().lower() for c in df.columns]
    forbidden = sorted(set(cols) & FORBIDDEN_COLUMNS)
    if forbidden:
        errors.append(f"Kişisel veri olabilecek sütun(lar) var: {forbidden}")
    missing = [c for c in CSV_COLUMNS if c not in df.columns]
    extra = [c for c in df.columns if c not in CSV_COLUMNS]
    if missing:
        errors.append(f"Eksik sütun(lar): {missing}")
    if extra:
        errors.append(f"Tanımsız sütun(lar): {extra}")
    if missing or forbidden:
        return errors
    if df.empty:
        return ["Veri seti boş."]

    def report(mask: pd.Series, msg: str) -> None:
        bad = df.index[mask].tolist()
        if bad:
            rows = ", ".join(str(i + 2) for i in bad[:MAX_ERRORS_PER_CHECK])
            more = f" (+{len(bad) - MAX_ERRORS_PER_CHECK} satır)" if len(bad) > MAX_ERRORS_PER_CHECK else ""
            errors.append(f"{msg}: CSV satır {rows}{more}")

    report(~df["oturum_id"].str.match(SESSION_RE), "oturum_id 12 karakter [a-z0-9] olmalı")
    report(~df["kaynak"].isin(SOURCES), "kaynak 'gercek', 'sentetik' veya 'test' olmalı")
    report(~df["sahne_id"].isin(CONCEPT_BY_SCENE.keys()), "Bilinmeyen sahne_id")
    report(~df["secim_id"].isin(RISK_SCORE.keys()), "Bilinmeyen secim_id")
    report(~df["riskli"].isin({"0", "1"}), "riskli 0/1 olmalı")
    report(~df["zaman_asimi"].isin({"0", "1"}), "zaman_asimi 0/1 olmalı")
    report(~df["destek_verildi"].isin({"0", "1"}), "destek_verildi 0/1 olmalı")
    report(~df[LABEL].isin({"0", "1", ""}), f"{LABEL} 0, 1 veya boş olmalı")

    numeric_cols = FEATURES + list(LOGGED_ONLY) + ["karar_id", "oyun_no"]
    num = {}
    for c in numeric_cols:
        num[c] = pd.to_numeric(df[c], errors="coerce")
        report(num[c].isna(), f"{c} eksik veya sayısal değil")
    for c, spec in {**FEATURE_SPECS, **LOGGED_ONLY}.items():
        v = num[c]
        report(v.notna() & ((v < spec["min"]) | (v > spec["max"])),
               f"{c} [{spec['min']}, {spec['max']}] aralığı dışında")
    mp = pd.to_numeric(df["model_p"].replace("", "0"), errors="coerce")
    report(mp.isna() | (mp < 0) | (mp > 1), "model_p boş veya 0–1 arası olmalı")

    if errors:
        return errors

    # Tutarlılık denetimleri (aynı satırdaki alanlar birbirini doğrular)
    scene_ok = df.apply(lambda r: r["secim_id"] in CHOICES_BY_SCENE[r["sahne_id"]], axis=1)
    report(~scene_ok, "secim_id bu sahnenin seçeneği değil")
    report(df["concept_id"] != df["sahne_id"].map(CONCEPT_BY_SCENE), "concept_id sahne_id ile uyuşmuyor")
    exp_risky = (df["secim_id"].isin(RISKY_CHOICES) | (df["zaman_asimi"] == "1")).astype(int).astype(str)
    report(df["riskli"] != exp_risky, "riskli, secim_id/zaman_asimi ile uyuşmuyor")
    report((num["branch_risk_score"] - df["secim_id"].map(RISK_SCORE)).abs() > 1e-6,
           "branch_risk_score secim_id ile uyuşmuyor")
    report(num["retry_count"] != num["oyun_no"] - 1, "retry_count = oyun_no - 1 olmalı")
    report((df["zaman_asimi"] == "1") & (num["decision_time_sec"] != 60), "Zaman aşımında decision_time_sec 60 olmalı")

    # Oturum içi denetimler
    for sid, g in df.assign(_k=num["karar_id"]).groupby("oturum_id", sort=False):
        g = g.sort_values("_k")
        if g["kaynak"].nunique() != 1:
            errors.append(f"Oturum {sid}: gerçek ve sentetik satırlar karışık")
        if list(g["_k"].astype(int)) != list(range(1, len(g) + 1)):
            errors.append(f"Oturum {sid}: karar_id 1'den başlayıp ardışık olmalı")
            continue
        risk = g["riskli"].tolist()
        labels = g[LABEL].tolist()
        expected = risk[1:] + [""]
        if labels != expected:
            errors.append(f"Oturum {sid}: etiket kuralı (§12) ihlal edildi; beklenen {expected}, bulunan {labels}")
        if len(errors) > 50:
            errors.append("... hata sayısı 50'yi aştı, durduruldu.")
            break
    return errors


def main(argv: list[str]) -> int:
    if not argv:
        print(__doc__)
        return 2
    status = 0
    for path in argv:
        df = load_csv(path)
        errs = validate(df)
        if errs:
            status = 1
            print(f"GEÇERSİZ  {path}")
            for e in errs:
                print(f"  - {e}")
        else:
            real = df.loc[df.kaynak == "gercek", "oturum_id"].nunique()
            synth = df.loc[df.kaynak == "sentetik", "oturum_id"].nunique()
            test = df.loc[df.kaynak == "test", "oturum_id"].nunique()
            print(f"GEÇERLİ   {path}: {len(df)} satır, {real} gerçek oturum, {synth} sentetik oturum"
                  + (f", {test} TEST oturumu (eğitime giremez)" if test else ""))
    return status


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
