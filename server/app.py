"""KARA KUTU — sunucu tüketicisi (FastAPI + onnxruntime). Bonus: üçüncü bağımsız tüketici.

Başlangıç reposundaki rails-api ile aynı API biçimi:
    POST /api/v1/predictions   {"inputs": {"decision_time_sec": 40, ...}}
      200 → {"proba": 0.73, "support": true, "model": {...}}
      422 → {"error": "geçersiz girdi", "missing": [...], "invalid": [...]}
    GET  /api/v1/model         → sürüm, statü, sha256, kaynak
    GET  /healthz

Model kaynağı (MODEL_SOURCE):
    local (varsayılan) → MODEL_DIR (model/ kabul edilmişse, yoksa model/gelistirme)
    http               → config.json'daki source.pinned_url (Hugging Face, commit'e sabitli)
Her iki durumda da indirilen/okunan dosyanın SHA-256'sı config.json ile karşılaştırılır; uyuşmazsa sunucu başlamaz.
Uyarı: Model statüsü 'kabul' değilse yanıtlarda açıkça belirtilir; istemciler uyarlamayı açmamalıdır.
"""
from __future__ import annotations

import hashlib
import json
import os
import urllib.request
from pathlib import Path

import numpy as np
import onnxruntime as ort
from fastapi import FastAPI
from fastapi.responses import JSONResponse

ROOT = Path(__file__).resolve().parents[1]


def _model_dir() -> Path:
    if os.environ.get("MODEL_DIR"):
        return Path(os.environ["MODEL_DIR"])
    return ROOT / "model" if (ROOT / "model" / "model.onnx").exists() else ROOT / "model" / "gelistirme"


def load():
    d = _model_dir()
    cfg = json.loads((d / "config.json").read_text(encoding="utf-8"))
    source = os.environ.get("MODEL_SOURCE", "local")
    if source == "http":
        url = cfg["source"]["pinned_url"]
        if not url:
            raise RuntimeError("MODEL_SOURCE=http ama config.json'da sabitli URL yok (model yayınlanmamış).")
        data = urllib.request.urlopen(url, timeout=30).read()
    else:
        data = (d / "model.onnx").read_bytes()
    sha = hashlib.sha256(data).hexdigest()
    if sha != cfg["artifact"]["sha256"]:
        raise RuntimeError(f"Model özeti config.json ile uyuşmuyor ({sha[:12]}); sunucu başlatılmadı.")
    sess = ort.InferenceSession(data, providers=["CPUExecutionProvider"])
    return cfg, sess, {"source": source, "dir": str(d.relative_to(ROOT)) if d.is_relative_to(ROOT) else str(d), "sha256": sha}


CFG, SESS, META = load()
ORDER = CFG["input"]["feature_order"]
SPEC = CFG["input"]["features"]
app = FastAPI(title="KARA KUTU destek modeli", version=CFG["model_version"])


def model_info():
    return {"name": CFG["model_name"], "version": CFG["model_version"], "release_status": CFG["release_status"],
            "threshold": CFG["support_threshold"], **META,
            "warning": None if CFG["release_status"] == "kabul" else
            "Model kabul kapılarını geçmedi; çıktı yalnızca gölge/test amaçlıdır, uyarlama için kullanılmamalıdır."}


@app.get("/healthz")
def healthz():
    return {"ok": True}


@app.get("/api/v1/model")
def model():
    return model_info()


@app.post("/api/v1/predictions")
def predict(body: dict):
    inputs = body.get("inputs") if isinstance(body, dict) else None
    if not isinstance(inputs, dict):
        return JSONResponse({"error": "geçersiz girdi", "missing": ORDER, "invalid": []}, status_code=422)
    missing = [f for f in ORDER if f not in inputs]
    invalid = []
    for f in ORDER:
        if f in inputs:
            v = inputs[f]
            if isinstance(v, bool) or not isinstance(v, (int, float)) or not np.isfinite(v) or not (SPEC[f]["min"] <= v <= SPEC[f]["max"]):
                invalid.append(f)
    if missing or invalid:
        return JSONResponse({"error": "geçersiz girdi", "missing": missing, "invalid": invalid}, status_code=422)
    x = np.array([[inputs[f] for f in ORDER]], dtype=np.float32)
    p = float(SESS.run(["probabilities"], {"features": x})[0][0, 1])
    return {"proba": p, "support": p >= CFG["support_threshold"], "model": model_info()}
