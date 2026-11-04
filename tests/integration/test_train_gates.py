"""train.py kapı davranışı: başarısız eğitim yapıt yayınlamaz, aday kabulün üzerine yazamaz, sonuç tekrarlanabilir."""
import json
import shutil
import subprocess
import sys
from pathlib import Path

import pytest

from generate_synthetic import generate, write_csv

ROOT = Path(__file__).resolve().parents[2]


def run(tmp: Path, data: Path, *flags) -> int:
    out = tmp / "model"
    out.mkdir(exist_ok=True)
    return subprocess.run([sys.executable, str(ROOT / "train.py"), "--veri", str(data), "--cikti", str(out), *flags],
                          capture_output=True, text=True).returncode


@pytest.fixture(scope="module")
def weak(tmp_path_factory):
    """Gerçek proje verisiyle aynı üretici varsayımları (zayıf sinyal)."""
    p = tmp_path_factory.mktemp("veri") / "zayif.csv"
    write_csv(generate(400, 20261104), p)
    return p


@pytest.fixture(scope="module")
def strong(tmp_path_factory):
    """YALNIZCA TEST: güçlü sinyalli SENTETİK veri (kaynak=sentetik). Kapıların geçme yolunu sınamak için."""
    p = tmp_path_factory.mktemp("veri") / "guclu.csv"
    write_csv(generate(400, 99, struggle_effect=30.0), p)
    return p


def test_metrik_kapisi_gecmezse_hicbir_dosya_yazilmaz(tmp_path, weak):
    assert run(tmp_path, weak) == 1
    assert list((tmp_path / "model").iterdir()) == []


def test_gelistirme_bayragi_yalnizca_alt_klasore_reddedildi_yazar(tmp_path, weak):
    assert run(tmp_path, weak, "--gelistirme") == 1
    assert not (tmp_path / "model" / "model.onnx").exists()
    cfg = json.loads((tmp_path / "model" / "gelistirme" / "config.json").read_text())
    assert cfg["release_status"] == "reddedildi" and cfg["rollout"]["mode"] == "shadow"


def test_gercek_veri_yoksa_varsayilan_durur(tmp_path, strong):
    assert run(tmp_path, strong) == 2
    assert list((tmp_path / "model").iterdir()) == []


def test_aday_bayragi_aday_yazar_ve_sifir_olmayan_kodla_cikar(tmp_path, strong):
    assert run(tmp_path, strong, "--aday") == 3
    v = json.loads((tmp_path / "model" / "model_version.json").read_text())
    assert v["release_status"] == "aday"


def test_aday_kabul_surumunun_uzerine_yazamaz(tmp_path, strong):
    out = tmp_path / "model"
    out.mkdir()
    (out / "model_version.json").write_text(json.dumps({"release_status": "kabul"}))
    assert run(tmp_path, strong, "--aday") == 4
    assert json.loads((out / "model_version.json").read_text())["release_status"] == "kabul"


def test_egitim_tekrarlanabilir(tmp_path, strong):
    a, b = tmp_path / "a", tmp_path / "b"
    a.mkdir(); b.mkdir()
    assert run(a, strong, "--aday") == 3 and run(b, strong, "--aday") == 3
    for f in ["model.onnx", "config.json", "metrics.json", "model_version.json", "README.md"]:
        assert (a / "model" / f).read_bytes() == (b / "model" / f).read_bytes(), f
