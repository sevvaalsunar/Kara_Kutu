"""Diferansiyel parite: Python Oracle ↔ ONNX dosyası ↔ onnxruntime-web (WASM)."""
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REF = json.loads((ROOT / "tests" / "parite.json").read_text(encoding="utf-8"))


def test_bes_referans_girdi_var():
    assert len(REF["referanslar"]) == 5
    assert REF["tolerans"] == 1e-4


def test_python_oracle_parite_json_ile_ayni():
    r = subprocess.run([sys.executable, str(ROOT / "tests" / "parite.py"), "--model", str(ROOT / REF["model_dosyasi"])],
                       capture_output=True, text=True)
    assert r.returncode == 0, r.stdout


def test_onnxruntime_web_python_ile_ayni():
    r = subprocess.run(["node", "scripts/parity-web.mjs"], cwd=ROOT / "app", capture_output=True, text=True)
    assert r.returncode == 0, r.stdout + r.stderr
    assert "GEÇTİ" in r.stdout


def test_dagitim_simulasyonu():
    r = subprocess.run(["npx", "tsx", "scripts/rollout-sim.ts"], cwd=ROOT / "app", capture_output=True, text=True)
    assert r.returncode == 0, r.stdout + r.stderr
