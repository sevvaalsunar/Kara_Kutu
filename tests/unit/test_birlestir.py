"""Birleştirici: gerçek oturum dosyalarının güvenlik denetimleri."""
import shutil
import subprocess
import sys
from pathlib import Path

import pandas as pd

from generate_synthetic import generate

ROOT = Path(__file__).resolve().parents[2]


def fake_real_file(path: Path, seed: int, kaynak: str = "gercek", n: int = 2):
    """YALNIZCA TEST: birleştiricinin dosya denetimlerini sınamak için geçici klasörde
    yeniden etiketlenmiş üretici satırları. data/ altına asla yazılmaz."""
    df = pd.DataFrame(generate(n, seed)).astype(str)
    df["kaynak"] = kaynak
    df.to_csv(path, index=False)
    return df


def run(tmp: Path, *extra):
    r = subprocess.run([sys.executable, str(ROOT / "data" / "birlestir.py"), "--sentetik", str(tmp / "yok.csv"),
                        "--gercek-dizin", str(tmp / "g"), "--cikti", str(tmp / "o.csv"), "--rapor", str(tmp / "r.md"), *extra],
                       capture_output=True, text=True)
    return r.returncode, r.stdout


def test_gecerli_dosyalar_birlesir_ve_rapor_uretilir(tmp_path):
    (tmp_path / "g").mkdir()
    fake_real_file(tmp_path / "g" / "a.csv", 1)
    fake_real_file(tmp_path / "g" / "b.csv", 2)
    code, out = run(tmp_path)
    assert code == 0, out
    assert "Gerçek veri kapısı" in (tmp_path / "r.md").read_text()


def test_ayni_dosya_iki_kez_reddedilir(tmp_path):
    (tmp_path / "g").mkdir()
    fake_real_file(tmp_path / "g" / "a.csv", 1)
    shutil.copy(tmp_path / "g" / "a.csv", tmp_path / "g" / "a-kopya.csv")
    code, out = run(tmp_path)
    assert code == 1 and "bayt bayt aynı" in out and not (tmp_path / "o.csv").exists()


def test_tekrar_eden_oturum_reddedilir(tmp_path):
    (tmp_path / "g").mkdir()
    df = fake_real_file(tmp_path / "g" / "a.csv", 1)
    df2 = pd.DataFrame(generate(2, 9)).astype(str)
    df2["kaynak"] = "gercek"
    df2["oturum_id"] = df2["oturum_id"].map(dict(zip(df2.oturum_id.unique(), df.oturum_id.unique())))
    df2.to_csv(tmp_path / "g" / "b.csv", index=False)
    code, out = run(tmp_path)
    assert code == 1 and "zaten" in out


def test_test_oturumu_gercek_klasorune_giremez(tmp_path):
    (tmp_path / "g").mkdir()
    fake_real_file(tmp_path / "g" / "t.csv", 1, kaynak="test")
    code, out = run(tmp_path)
    assert code == 1 and "kaynak=test" in out


def test_tamamlanmamis_oturum_uyari_verir(tmp_path):
    (tmp_path / "g").mkdir()
    df = pd.DataFrame(generate(1, 3)).astype(str)
    df["kaynak"] = "gercek"
    df = df.iloc[:2].copy()  # K1, K2: K3 yok
    df.loc[df.index[-1], "needs_learning_support"] = ""
    df.to_csv(tmp_path / "g" / "yarim.csv", index=False)
    code, out = run(tmp_path)
    assert code == 0, out
    assert "tamamlanmamış" in (tmp_path / "r.md").read_text()


def test_gecersizleri_atla_hatalilari_ayirir_gecerlileri_birlestirir(tmp_path):
    (tmp_path / "g").mkdir()
    fake_real_file(tmp_path / "g" / "iyi.csv", 1)
    fake_real_file(tmp_path / "g" / "test.csv", 2, kaynak="test")
    code, out = run(tmp_path, "--gecersizleri-atla")
    assert code == 0, out
    assert (tmp_path / "g" / "reddedilen" / "test.csv").exists()
    assert "kaynak=test" in (tmp_path / "g" / "reddedilen" / "NEDENLER.txt").read_text()
    merged = pd.read_csv(tmp_path / "o.csv", dtype=str)
    assert set(merged.kaynak) == {"gercek"} and "Reddedilen dosya" in (tmp_path / "r.md").read_text()
