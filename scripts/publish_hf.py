"""Kabul edilmiş modeli Hugging Face Hub'a yayınlar ve commit'e sabitli URL'yi kaydeder (spec.md §19).

Kullanım:
    export HF_TOKEN=...                       # asla koda yazma
    python scripts/publish_hf.py --repo <kullanici>/kara-kutu-destek --kuru   # yalnızca denetim
    python scripts/publish_hf.py --repo <kullanici>/kara-kutu-destek          # yayınla

Kurallar:
- Yalnızca model/ kökündeki ve release_status == "kabul" olan model yayınlanır.
  Aday veya reddedilmiş model (model/gelistirme/) yayınlanamaz.
- Yayından sonra commit SHA'sı alınır, sabitli URL'den model indirilip özeti doğrulanır,
  ardından model/config.json, model/model_version.json ve RELEASE.md güncellenir.
- Üretim tüketicisi asla `main` dalını kullanmaz: /resolve/<commit>/model.onnx
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import tempfile
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODEL = ROOT / "model"
FILES = ["model.onnx", "config.json", "metrics.json", "model_version.json", "README.md"]


def fail(msg: str) -> int:
    print(f"YAYIN REDDEDİLDİ: {msg}")
    return 1


def preflight(MODEL: Path = MODEL) -> tuple[dict, dict] | str:
    missing = [f for f in FILES if not (MODEL / f).exists()]
    if missing:
        return f"model/ altında eksik dosya: {missing}. (Reddedilmiş model model/gelistirme/ altındadır ve yayınlanamaz.)"
    cfg = json.loads((MODEL / "config.json").read_text(encoding="utf-8"))
    ver = json.loads((MODEL / "model_version.json").read_text(encoding="utf-8"))
    if cfg.get("release_status") != "kabul" or ver.get("release_status") != "kabul":
        return f"statü '{ver.get('release_status')}'; yalnızca 'kabul' yayınlanır."
    sha = hashlib.sha256((MODEL / "model.onnx").read_bytes()).hexdigest()
    if sha != cfg["artifact"]["sha256"]:
        return "model.onnx özeti config.json ile uyuşmuyor."
    metrics = json.loads((MODEL / "metrics.json").read_text(encoding="utf-8"))
    failed = [k for k, v in metrics["kapilar"].items() if not v["gecti"]]
    if failed:
        return f"metrics.json'da geçmeyen kapı var: {failed}"
    return cfg, ver


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", required=True, help="<kullanici>/<repo>")
    ap.add_argument("--kuru", action="store_true", help="Yalnızca ön denetim; ağa çıkmaz")
    a = ap.parse_args()

    pre = preflight()
    if isinstance(pre, str):
        return fail(pre)
    cfg, ver = pre
    print(f"Ön denetim geçti: {cfg['model_name']} {cfg['model_version']} ({cfg['release_status']})")
    if a.kuru:
        print("Kuru çalıştırma: yayın yapılmadı.")
        return 0

    token = os.environ.get("HF_TOKEN")
    if not token:
        return fail("HF_TOKEN ortam değişkeni yok (ya da `huggingface-cli login` ile oturum açın ve HF_TOKEN'ı ayarlayın).")

    from huggingface_hub import HfApi  # yalnızca gerçek yayında gerekir

    api = HfApi(token=token)
    api.create_repo(a.repo, repo_type="model", private=False, exist_ok=True)
    info = api.upload_folder(
        repo_id=a.repo, folder_path=str(MODEL), allow_patterns=FILES,
        commit_message=f"{cfg['release_tag']}: {cfg['model_name']} {cfg['model_version']} (veri {cfg['dataset_version']})",
    )
    commit = info.oid
    api.create_tag(a.repo, tag=cfg["release_tag"], revision=commit, exist_ok=False)
    pinned = f"https://huggingface.co/{a.repo}/resolve/{commit}/model.onnx"

    # Sabitli URL'den indirip özeti doğrula: yayın, tüketicinin göreceği dosyayla kanıtlanır
    with tempfile.TemporaryDirectory() as td:
        dst = Path(td) / "model.onnx"
        urllib.request.urlretrieve(pinned, dst)
        if hashlib.sha256(dst.read_bytes()).hexdigest() != cfg["artifact"]["sha256"]:
            return fail(f"Sabitli URL'deki dosyanın özeti beklenenden farklı: {pinned}")

    cfg["source"] = {"hf_repo": a.repo, "hf_commit": commit, "pinned_url": pinned}
    ver["hf"] = {"repo": a.repo, "commit": commit, "pinned_url": pinned}
    (MODEL / "config.json").write_text(json.dumps(cfg, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (MODEL / "model_version.json").write_text(json.dumps(ver, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    rel = ROOT / "RELEASE.md"
    text = rel.read_text(encoding="utf-8")
    text = text.replace("<!-- HF_REPO -->", a.repo).replace("<!-- HF_COMMIT -->", commit).replace("<!-- HF_PINNED_URL -->", pinned)
    rel.write_text(text, encoding="utf-8")
    print(f"YAYINLANDI: {a.repo} @ {commit}\nSabitli URL: {pinned}\nconfig.json ve RELEASE.md güncellendi; değişiklikleri commit'leyin.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
