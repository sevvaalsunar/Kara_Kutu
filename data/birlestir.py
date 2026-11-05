"""Sentetik veri ile oyuncuların indirdiği gerçek oturum CSV'lerini birleştirir ve veri raporu üretir.

Kullanım:
    python data/birlestir.py
    python data/birlestir.py --gecersizleri-atla   # hatalı dosyaları gercek/reddedilen/ altına taşır, kalanları birleştirir
    python data/birlestir.py --gercek-dizin <klasör> --cikti <csv> --rapor <md>   (testler için)

Girdi : data/sentetik.csv, data/gercek/*.csv (oyunun "Oturum verisini indir" çıktısı)
Çıktı : data/oturumlar.csv, data/VERI_RAPORU.md

Reddedilen dosyalar (birleştirme yapılmaz, çıkış kodu 1):
- şemaya veya tutarlılık kurallarına uymayan (validate_dataset.py)
- gercek/ altında kaynak=gercek olmayan satır içeren (ör. ?test=1 ile oynanmış kaynak=test oturumları)
- başka bir dosyayla bayt bayt aynı olan (aynı CSV iki kez eklenmiş)
- başka bir dosyadaki oturum_id'yi tekrar eden
Uyarılar (birleştirme yapılır, raporda listelenir):
- tamamlanmamış oturum (son kararı K3 değil: oyuncu oyunu yarıda bırakmış)
- etiketli satırı olmayan oturum (tek kararlık oturum)
"""
from __future__ import annotations

import argparse
import hashlib
import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent))
from schema import CSV_COLUMNS, FEATURES, LABEL  # noqa: E402
from validate_dataset import load_csv, validate  # noqa: E402

ROOT = Path(__file__).resolve().parent
MIN_REAL_SESSIONS = 15


def check_real_files(files: list[Path]) -> tuple[list[pd.DataFrame], list[str], list[str]]:
    """Gerçek oturum dosyalarını tek tek denetler. Döner: (geçerli tablolar, hatalar, uyarılar)."""
    frames, errors, warnings = [], [], []
    seen_hash: dict[str, str] = {}
    seen_session: dict[str, str] = {}
    for f in files:
        digest = hashlib.sha256(f.read_bytes()).hexdigest()
        if digest in seen_hash:
            errors.append(f"{f.name}: {seen_hash[digest]} ile bayt bayt aynı (aynı dosya iki kez eklenmiş)")
            continue
        seen_hash[digest] = f.name
        df = load_csv(f)
        errs = validate(df)
        if not errs and (df["kaynak"] != "gercek").any():
            kinds = sorted(set(df["kaynak"]) - {"gercek"})
            errs.append(f"kaynak={kinds} satırları var; gercek/ klasörü yalnızca gerçek oyuncu oturumlarını kabul eder"
                        + (" (kaynak=test: ?test=1 ile oynanmış doğrulama oturumu)" if "test" in kinds else ""))
        if "oturum_id" in df.columns:
            dup = sorted(s for s in set(df["oturum_id"]) if s in seen_session)
            if dup:
                errs.append(f"oturum_id {dup} zaten {seen_session[dup[0]]} dosyasında var")
        if errs:
            errors.append(f"{f.name}: " + "; ".join(errs))
            continue
        for sid, g in df.groupby("oturum_id"):
            seen_session[sid] = f.name
            last = g.sort_values("karar_id", key=lambda c: c.astype(int)).iloc[-1]
            if last["sahne_id"] != "K3":
                warnings.append(f"{f.name}: oturum {sid} tamamlanmamış (son sahne {last['sahne_id']})")
            if (g[LABEL] != "").sum() == 0:
                warnings.append(f"{f.name}: oturum {sid} tek kararlık; etiketli satırı yok, eğitime katkısı olmaz")
        frames.append(df)
    return frames, errors, warnings


def report(out: pd.DataFrame, files: list[Path], warnings: list[str]) -> str:
    lab = out[out[LABEL] != ""]
    real_sessions = out.loc[out.kaynak == "gercek", "oturum_id"].nunique()

    def pos_rate(src: str) -> str:
        l = lab.loc[lab.kaynak == src, LABEL]
        return f"{l.astype(int).mean():.3f}" if len(l) else "—"

    lines = ["# Veri raporu", "", "`python data/birlestir.py` tarafından üretilir; elle düzenlemeyin.", "",
             "| | Gerçek | Sentetik |", "|---|---|---|",
             f"| Oturum | {real_sessions} | {out.loc[out.kaynak == 'sentetik', 'oturum_id'].nunique()} |",
             f"| Satır (karar) | {(out.kaynak == 'gercek').sum()} | {(out.kaynak == 'sentetik').sum()} |",
             f"| Etiketli satır | {(lab.kaynak == 'gercek').sum()} | {(lab.kaynak == 'sentetik').sum()} |",
             f"| Pozitif oran (`{LABEL}`=1) | {pos_rate('gercek')} | {pos_rate('sentetik')} |",
             "",
             f"**Gerçek veri kapısı:** {real_sessions}/{MIN_REAL_SESSIONS} oturum: "
             + ("karşılandı." if real_sessions >= MIN_REAL_SESSIONS else "**karşılanmadı**; model kabul edilemez."),
             "", "## Gerçek oturum dosyaları", ""]
    lines += [f"- `{f.name}`" for f in files] or ["- (yok)"]
    lines += ["", "## Uyarılar", ""] + ([f"- {w}" for w in warnings] or ["- (yok)"])
    lines += ["", "## Özellik ortalamaları (etiketli satırlar; kaynak / etiket)", "",
              "| Özellik | gerçek / 0 | gerçek / 1 | sentetik / 0 | sentetik / 1 |", "|---|---|---|---|---|"]
    for c in FEATURES:
        vals = []
        for s in ("gercek", "sentetik"):
            for y in ("0", "1"):
                v = pd.to_numeric(lab.loc[(lab.kaynak == s) & (lab[LABEL] == y), c])
                vals.append(f"{v.mean():.3f}" if len(v) else "—")
        lines.append(f"| `{c}` | " + " | ".join(vals) + " |")
    return "\n".join(lines) + "\n"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--sentetik", default=str(ROOT / "sentetik.csv"))
    ap.add_argument("--gercek-dizin", default=str(ROOT / "gercek"))
    ap.add_argument("--cikti", default=str(ROOT / "oturumlar.csv"))
    ap.add_argument("--rapor", default=str(ROOT / "VERI_RAPORU.md"))
    ap.add_argument("--gecersizleri-atla", action="store_true",
                    help="Hatalı dosyaları <gercek>/reddedilen/ altına gerekçesiyle taşı ve kalanları birleştir")
    a = ap.parse_args()

    parts = []
    synth = Path(a.sentetik)
    if synth.exists():
        df = load_csv(synth)
        if (df.kaynak != "sentetik").any():
            print("HATA: sentetik dosyada kaynak=sentetik olmayan satır var.")
            return 1
        parts.append(df)
    files = sorted(Path(a.gercek_dizin).glob("*.csv"))
    frames, errors, warnings = check_real_files(files)
    if errors and not a.gecersizleri_atla:
        print("REDDEDİLDİ (birleştirme yapılmadı):\n  - " + "\n  - ".join(errors))
        print("İpucu: --gecersizleri-atla hatalı dosyaları ayırıp geçerlileri birleştirir.")
        return 1
    if errors:
        rej = Path(a.gercek_dizin) / "reddedilen"
        rej.mkdir(exist_ok=True)
        bad_names = {e.split(":", 1)[0] for e in errors}
        for name in bad_names:
            (Path(a.gercek_dizin) / name).rename(rej / name)
        (rej / "NEDENLER.txt").write_text("\n".join(errors) + "\n", encoding="utf-8")
        print(f"{len(bad_names)} hatalı dosya {rej} altına taşındı (nedenler: NEDENLER.txt).")
        files = sorted(Path(a.gercek_dizin).glob("*.csv"))
        frames, errors, warnings = check_real_files(files)
        warnings = [f"Reddedilen dosya: {e}" for e in (rej / "NEDENLER.txt").read_text(encoding="utf-8").splitlines()] + warnings
    parts += frames
    if not parts:
        print("Birleştirilecek veri yok.")
        return 1
    out = pd.concat(parts, ignore_index=True)[CSV_COLUMNS]
    if out.duplicated(["oturum_id", "karar_id"]).any():
        print("HATA: Aynı oturum_id/karar_id birden fazla kez var.")
        return 1
    errs = validate(out)
    if errs:
        print("Birleşik veri geçersiz:\n  - " + "\n  - ".join(errs))
        return 1
    out.to_csv(a.cikti, index=False, lineterminator="\n")
    Path(a.rapor).write_text(report(out, files, warnings), encoding="utf-8")
    real = out.loc[out.kaynak == "gercek", "oturum_id"].nunique()
    synth_n = out.loc[out.kaynak == "sentetik", "oturum_id"].nunique()
    print(f"{Path(a.cikti).name}: {len(out)} satır; {real} gerçek, {synth_n} sentetik oturum; "
          f"{len(warnings)} uyarı → {Path(a.rapor).name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
