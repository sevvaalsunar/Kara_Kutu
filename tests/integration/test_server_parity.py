"""Bonus: sunucu tüketicisi (FastAPI + onnxruntime) aynı referans girdilerde Python Oracle ile < 1e-4 vermeli.
Gerçek bir uvicorn süreci başlatılır ve HTTP üzerinden sorgulanır (mock yok)."""
import json
import socket
import subprocess
import sys
import time
from pathlib import Path

import httpx
import pytest

ROOT = Path(__file__).resolve().parents[2]


@pytest.fixture(scope="module")
def base_url():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0)); port = s.getsockname()[1]
    proc = subprocess.Popen([sys.executable, "-m", "uvicorn", "server.app:app", "--port", str(port)], cwd=ROOT,
                            stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    url = f"http://127.0.0.1:{port}"
    for _ in range(60):
        try:
            if httpx.get(url + "/healthz", timeout=1).status_code == 200:
                break
        except httpx.HTTPError:
            time.sleep(0.25)
    else:
        proc.kill(); pytest.fail(proc.stdout.read().decode())
    yield url
    proc.terminate(); proc.wait(5)


@pytest.mark.parametrize("dosya", ["parite.json", "parite_sinir.json"])
def test_sunucu_python_oracle_ile_ayni(base_url, dosya):
    ref = json.loads((ROOT / "tests" / dosya).read_text(encoding="utf-8"))
    info = httpx.get(base_url + "/api/v1/model").json()
    assert info["sha256"] == ref["model_sha256"]
    worst = 0.0
    for r in ref["referanslar"]:
        res = httpx.post(base_url + "/api/v1/predictions", json={"inputs": r["girdi"]})
        assert res.status_code == 200, res.text
        worst = max(worst, abs(res.json()["proba"] - r["beklenen_p"]))
    print(f"{dosya}: {len(ref['referanslar'])} girdi, en büyük fark {worst:.2e}")
    assert worst < ref["tolerans"]


def test_reddedilmis_model_yanitta_uyari_tasir(base_url):
    info = httpx.get(base_url + "/api/v1/model").json()
    assert info["release_status"] == "reddedildi" and "kullanılmamalıdır" in info["warning"]


def test_gecersiz_girdi_422(base_url):
    ref = json.loads((ROOT / "tests" / "parite.json").read_text(encoding="utf-8"))
    girdi = dict(ref["referanslar"][0]["girdi"]); girdi["hint_usage_rate"] = 2; girdi.pop("retry_count")
    res = httpx.post(base_url + "/api/v1/predictions", json={"inputs": girdi})
    assert res.status_code == 422
    assert res.json()["missing"] == ["retry_count"] and res.json()["invalid"] == ["hint_usage_rate"]
