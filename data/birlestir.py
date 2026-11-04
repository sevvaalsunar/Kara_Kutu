"""Sentetik veri ile oyuncuların indirdiği gerçek oturum CSV'lerini oturumlar.csv'de birleştirir.

Kullanım:
    python data/birlestir.py
Girdi : data/sentetik.csv, data/gercek/*.csv (oyunun "Oturum verisini indir" çıktısı)
Çıktı : data/oturumlar.csv
Her girdi ayrı doğrulanır; gercek/ altındaki dosyalarda yalnızca kaynak=gercek kabul edilir.
"""
from __future__ import annotations

import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent))
from schema import CSV_COLUMNS  # noqa: E402
from validate_dataset import load_csv, validate  # noqa: E402

ROOT = Path(__file__).resolve().parent


def main() -> int:
    parts, ok = [], True
    synth = ROOT / "sentetik.csv"
    if synth.exists():
        df = load_csv(synth)
        if (df.kaynak != "sentetik").any():
            print("HATA: sentetik.csv içinde kaynak=sentetik olmayan satır var.")
            return 1
        parts.append(df)
    for f in sorted((ROOT / "gercek").glob("*.csv")):
        df = load_csv(f)
        errs = validate(df)
        if (df.get("kaynak") != "gercek").any():
            errs.append("gercek/ klasöründeki dosyada kaynak=gercek olmayan satır var")
        if errs:
            ok = False
            print(f"REDDEDİLDİ {f.name}: " + "; ".join(errs))
            continue
        parts.append(df)
    if not ok:
        return 1
    if not parts:
        print("Birleştirilecek veri yok.")
        return 1
    out = pd.concat(parts, ignore_index=True)[CSV_COLUMNS]
    dup = out.groupby("oturum_id")["kaynak"].nunique()
    seen = out.drop_duplicates(["oturum_id", "karar_id"])
    if len(seen) != len(out):
        print("HATA: Aynı oturum_id/karar_id iki kez var (aynı CSV iki kez mi eklendi?).")
        return 1
    errs = validate(out)
    if errs:
        print("Birleşik veri geçersiz:\n  - " + "\n  - ".join(errs))
        return 1
    out.to_csv(ROOT / "oturumlar.csv", index=False, lineterminator="\n")
    real = out.loc[out.kaynak == "gercek", "oturum_id"].nunique()
    print(f"oturumlar.csv: {len(out)} satır; {real} gerçek, {len(dup) - real} sentetik oturum")
    return 0


if __name__ == "__main__":
    sys.exit(main())
