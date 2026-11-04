"""Deterministik sentetik oturum üretici (spec.md §16).

Kullanım:
    python data/generate_synthetic.py --oturum 400 --tohum 20261104 --cikti data/sentetik.csv

Üretim kuralları (README.md "Sentetik veri" bölümünde de belgelenir):
- Her oturum için gizli bir "zorlanma" değeri s ~ Beta(2, 2) çekilir. s yalnızca üretimde
  kullanılır; CSV'ye yazılmaz. Gerçek oyuncularda böyle bir değişken ölçülmez.
- Seviye s'ye bağlı seçilir (zorlananlar daha sık "Yeni başladım" seçer).
- Oturum 1–3 oyundan oluşur (olasılıklar 0.50 / 0.35 / 0.15). Yol, seçimlere göre gerçek
  oyun ağacını izler (K1 → K2_1A|K2_1B → K3).
- Riskli seçim olasılığı: sigmoid(-0.4 + 4.0·(s − 0.5) − 0.7·(bu sahnenin önceki deneme sayısı) + sahne_sapması).
  Sahne sapması: K1 0.0, K2_1A 0.0, K2_1B −0.2, K3 +0.2.
- Deneyimliyim seviyesinde süre dolma olasılığı 0.03 + 0.20·s; dolarsa riskli seçenek uygulanır.
- Karar süresi log-normal: medyan (6 + 30·s) sn, deneyimlide ×0.8, σ = 0.55.
- Tereddüt ~ Poisson(0.4 + 3.5·s). İpucu kullanımı ~ Bernoulli(0.10 + 0.60·s), yeni seviyede +0.10.
- Sentetik oturumlarda hiç müdahale yoktur: destek_verildi = 0, model_p boş.
Özellikler ve etiketler data/schema.py'deki referans fonksiyonlarla hesaplanır.
"""
from __future__ import annotations

import argparse
import csv
import math
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from schema import (  # noqa: E402
    CHOICES_BY_SCENE, CONCEPT_BY_SCENE, CSV_COLUMNS, LABEL, DecisionEvent,
    compute_features, label_for, support_effectiveness,
)

DEFAULT_SEED = 20261104
SCENE_BIAS = {"K1": 0.0, "K2_1A": 0.0, "K2_1B": -0.2, "K3": 0.2}
TIMEOUT_CHOICE = {"K1": "1A", "K2_1A": "2A1", "K2_1B": "2B2", "K3": "B"}
ALPHABET = list("abcdefghijklmnopqrstuvwxyz0123456789")


def _sigmoid(x: float) -> float:
    return 1.0 / (1.0 + math.exp(-x))


def simulate_session(rng: np.random.Generator, return_latent: bool = False, struggle_effect: float = 4.0):
    s = float(rng.beta(2, 2))
    w = np.array([0.15 + 0.6 * s, 0.45, 0.85 - 0.6 * s])
    level = int(rng.choice(3, p=w / w.sum()))
    n_games = int(rng.choice([1, 2, 3], p=[0.50, 0.35, 0.15]))
    events: list[DecisionEvent] = []
    seen: dict[str, int] = {}
    for game in range(1, n_games + 1):
        scene = "K1"
        while scene:
            prior = seen.get(scene, 0)
            seen[scene] = prior + 1
            timeout = level == 2 and rng.random() < 0.03 + 0.20 * s
            if timeout:
                choice, t = TIMEOUT_CHOICE[scene], 60.0
            else:
                p_risky = _sigmoid(-0.4 + struggle_effect * (s - 0.5) - 0.7 * prior + SCENE_BIAS[scene])
                risky = rng.random() < p_risky
                choice = TIMEOUT_CHOICE[scene] if risky else next(
                    c for c in CHOICES_BY_SCENE[scene] if c != TIMEOUT_CHOICE[scene])
                median = (6.0 + 30.0 * s) * (0.8 if level == 2 else 1.0)
                t = float(np.exp(rng.normal(math.log(median), 0.55)))
                t = min(t, 59.0) if level == 2 else min(t, 300.0)
            events.append(DecisionEvent(
                sahne_id=scene,
                secim_id=choice,
                zaman_asimi=bool(timeout),
                decision_time_sec=round(t, 2),
                hesitation_count=int(rng.poisson(0.4 + 3.5 * s)),
                ipucu_kullandi=bool(rng.random() < 0.10 + 0.60 * s + (0.10 if level == 0 else 0.0)),
                oyun_no=game,
                difficulty_level=level,
            ))
            if scene == "K1":
                scene = "K2_1A" if choice == "1A" else "K2_1B"
            elif scene.startswith("K2"):
                scene = "K3"
            else:
                scene = ""
    return (events, s) if return_latent else events


def session_rows(events: list[DecisionEvent], session_id: str, source: str) -> list[dict]:
    rows = []
    for t, e in enumerate(events):
        f = compute_features(events, t)
        lab = label_for(events, t)
        rows.append({
            "oturum_id": session_id,
            "karar_id": t + 1,
            "oyun_no": e.oyun_no,
            "sahne_id": e.sahne_id,
            "concept_id": CONCEPT_BY_SCENE[e.sahne_id],
            "secim_id": e.secim_id,
            "riskli": int(e.riskli),
            "zaman_asimi": int(e.zaman_asimi),
            **{k: _fmt(v) for k, v in f.items()},
            "decision_change_count": 0,
            "previous_support_effectiveness": _fmt(support_effectiveness(events, t)),
            "destek_verildi": int(e.destek_verildi),
            "model_p": "",
            LABEL: "" if lab is None else lab,
            "kaynak": source,
        })
    return rows


def _fmt(v: float) -> str:
    return f"{v:.6g}"


def generate(n_sessions: int, seed: int, struggle_effect: float = 4.0) -> list[dict]:
    rng = np.random.default_rng(seed)
    rows: list[dict] = []
    used: set[str] = set()
    for _ in range(n_sessions):
        sid = "".join(rng.choice(ALPHABET, 12))
        while sid in used:
            sid = "".join(rng.choice(ALPHABET, 12))
        used.add(sid)
        rows.extend(session_rows(simulate_session(rng, struggle_effect=struggle_effect), sid, "sentetik"))
    return rows


def write_csv(rows: list[dict], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=CSV_COLUMNS, lineterminator="\n")
        w.writeheader()
        w.writerows(rows)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--oturum", type=int, default=400)
    ap.add_argument("--tohum", type=int, default=DEFAULT_SEED)
    ap.add_argument("--cikti", default=str(Path(__file__).parent / "sentetik.csv"))
    a = ap.parse_args()
    rows = generate(a.oturum, a.tohum)
    write_csv(rows, Path(a.cikti))
    print(f"{a.oturum} sentetik oturum, {len(rows)} satır → {a.cikti} (tohum {a.tohum})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
