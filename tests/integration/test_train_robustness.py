"""train.py geçersiz veya yetersiz veride net bir hatayla durmalı ve hiçbir yapıt yazmamalı."""
import subprocess
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import pytest
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from generate_synthetic import generate, write_csv

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
import train  # noqa: E402


def run(tmp: Path, data: Path):
    out = tmp / "model"
    out.mkdir(exist_ok=True)
    r = subprocess.run([sys.executable, str(ROOT / "train.py"), "--veri", str(data), "--cikti", str(out), "--aday"],
                       capture_output=True, text=True)
    return r.returncode, r.stdout, sorted(p.name for p in out.iterdir())


@pytest.fixture(scope="module")
def base_df():
    return pd.DataFrame(generate(60, 5)).astype(str)


def write(tmp, df, name="d.csv"):
    p = tmp / name
    df.to_csv(p, index=False)
    return p


def test_veri_seti_yoksa_durur(tmp_path):
    code, out, files = run(tmp_path, tmp_path / "yok.csv")
    assert code == 1 and "VERİ YOK" in out and files == []


def test_gecersiz_sutun_reddedilir(tmp_path, base_df):
    code, out, files = run(tmp_path, write(tmp_path, base_df.drop(columns=["hesitation_count"])))
    assert code == 1 and "Eksik sütun" in out and files == []


def test_gecersiz_etiket_reddedilir(tmp_path, base_df):
    bad = base_df.copy()
    bad.loc[bad.index[bad.needs_learning_support != ""][0], "needs_learning_support"] = "2"
    code, out, files = run(tmp_path, write(tmp_path, bad))
    assert code == 1 and "VERİ GEÇERSİZ" in out and files == []


def test_test_kaynakli_satirlar_egitime_giremez(tmp_path, base_df):
    bad = base_df.copy()
    sid = bad.oturum_id.iloc[0]
    bad.loc[bad.oturum_id == sid, "kaynak"] = "test"
    code, out, files = run(tmp_path, write(tmp_path, bad))
    assert code == 1 and "kaynak=test" in out and files == []


def test_tek_sinifli_veride_degerlendirme_kurulamaz(tmp_path, base_df):
    # Yalnızca etiketi 0 olan satırlar + etiketsiz son kararlar: geçerli ama tek sınıflı bir veri
    keep = base_df[base_df.needs_learning_support != "1"]
    sessions = [s for s, g in keep.groupby("oturum_id") if (g.needs_learning_support == "").sum() == 1
                and len(g) == len(base_df[base_df.oturum_id == s])]
    one_class = base_df[base_df.oturum_id.isin(sessions)]
    assert len(one_class) and set(one_class.needs_learning_support) <= {"0", ""}
    code, out, files = run(tmp_path, write(tmp_path, one_class))
    assert code == 1 and "VERİ YETERSİZ" in out and files == []


def test_kucuk_veride_degerlendirme_kurulamaz(tmp_path, base_df):
    small = base_df[base_df.oturum_id.isin(base_df.oturum_id.unique()[:3])]
    code, out, files = run(tmp_path, write(tmp_path, small))
    assert code == 1 and "VERİ YETERSİZ" in out and files == []


def test_onnx_parite_bozuk_modeli_yakalar(tmp_path):
    """Parite denetimi gerçekten ayırt edici olmalı: başka bir pipeline'ın ONNX'i büyük fark üretmeli."""
    settings = {"tohum": 1, "model": {"C": 1.0, "class_weight": None, "max_iter": 200},
                "onnx": {"opset": 17, "ml_opset": 3}, "model_adi": "t", "model_surumu": "0.0.0"}
    rng = np.random.default_rng(0)
    X = rng.random((200, len(train.FEATURES))).astype(np.float32)
    y = (X[:, 0] > 0.5).astype(int)
    good = train.build_model(settings).fit(X, y)
    other = Pipeline([("scaler", StandardScaler()), ("clf", LogisticRegression())]).fit(X, 1 - y)
    path = tmp_path / "m.onnx"
    train.export_onnx(other, settings, path)
    assert train.onnx_parity(good, path, X, 1)["max_abs_fark"] > 0.1
    train.export_onnx(good, settings, path)
    assert train.onnx_parity(good, path, X, 1)["max_abs_fark"] < 1e-4
