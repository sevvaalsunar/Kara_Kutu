"""Yayın koruması ve sürüm sözleşmesi: kabul edilmemiş hiçbir model yayınlanamaz."""
import hashlib
import json
import shutil
import sys
from pathlib import Path

import pytest
from jsonschema import ValidationError, validate

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))
import publish_hf  # noqa: E402

SCHEMA = json.loads((ROOT / "model" / "config.schema.json").read_text())
DEV = ROOT / "model" / "gelistirme"


@pytest.fixture
def dizin(tmp_path):
    """Reddedilmiş modelin kopyası. Statü testlerde değiştirilir; asıl model/ klasörüne dokunulmaz."""
    d = tmp_path / "model"
    shutil.copytree(DEV, d)
    return d


def set_status(d, status):
    for f in ("config.json", "model_version.json"):
        j = json.loads((d / f).read_text())
        j["release_status"] = status
        (d / f).write_text(json.dumps(j))


def test_reddedilmis_model_yayinlanamaz(dizin):
    assert "reddedildi" in publish_hf.preflight(dizin)


def test_aday_model_yayinlanamaz(dizin):
    set_status(dizin, "aday")
    assert "aday" in publish_hf.preflight(dizin)


def test_statu_kabul_olsa_bile_gecmeyen_kapi_yayini_engeller(dizin):
    set_status(dizin, "kabul")  # metrics.json hâlâ geçmeyen kapıları içeriyor
    assert "geçmeyen kapı" in publish_hf.preflight(dizin)


def test_ozet_uyusmazsa_yayin_engellenir(dizin):
    set_status(dizin, "kabul")
    (dizin / "model.onnx").write_bytes((dizin / "model.onnx").read_bytes() + b"\0")
    assert "özeti" in publish_hf.preflight(dizin)


def test_eksik_dosya_yayini_engeller(dizin):
    (dizin / "metrics.json").unlink()
    assert "eksik" in publish_hf.preflight(dizin)


def test_asil_model_klasorunde_yayinlanabilir_model_yok():
    assert isinstance(publish_hf.preflight(), str)


def test_config_sozlesmesi_gecerli():
    validate(json.loads((DEV / "config.json").read_text()), SCHEMA)


def test_sabitli_url_yalnizca_commit_hash_kabul_eder():
    cfg = json.loads((DEV / "config.json").read_text())
    commit = "a" * 40
    cfg["source"] = {"hf_repo": "u/r", "hf_commit": commit,
                     "pinned_url": f"https://huggingface.co/u/r/resolve/{commit}/model.onnx"}
    validate(cfg, SCHEMA)
    for bad in ("main", "v2.0", "abc123"):
        cfg["source"]["pinned_url"] = f"https://huggingface.co/u/r/resolve/{bad}/model.onnx"
        with pytest.raises(ValidationError):
            validate(cfg, SCHEMA)


def test_config_ozeti_dosyayla_ayni():
    cfg = json.loads((DEV / "config.json").read_text())
    assert hashlib.sha256((DEV / "model.onnx").read_bytes()).hexdigest() == cfg["artifact"]["sha256"]


def test_reddedilmis_modelin_dagitim_modu_golge():
    cfg = json.loads((DEV / "config.json").read_text())
    assert cfg["release_status"] == "reddedildi" and cfg["rollout"]["mode"] == "shadow"
