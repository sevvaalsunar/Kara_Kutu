"""Tarayıcıdaki TypeScript özellik hesaplayıcısı Python referansıyla aynı sonucu vermeli."""
import json
import subprocess
from pathlib import Path

import numpy as np

from generate_synthetic import ALPHABET, session_rows, simulate_session
from schema import compute_features, label_for, support_effectiveness

ROOT = Path(__file__).resolve().parents[2]


def test_ts_ozellikleri_python_ile_ayni(tmp_path):
    rng = np.random.default_rng(424242)
    sessions = []
    for i in range(60):
        events = simulate_session(rng)
        # Destek verilen kararları da sına (sentetik veride hiç yok)
        for j, e in enumerate(events):
            e.destek_verildi = (i + j) % 3 == 0
        sid = "".join(rng.choice(ALPHABET, 12))
        rows = session_rows(events, sid, "sentetik")
        sessions.append({
            "id": sid,
            "events": [{**e.__dict__} for e in events],
            "features": [compute_features(events, t) for t in range(len(events))],
            "labels": [label_for(events, t) for t in range(len(events))],
            "support_eff": [support_effectiveness(events, t) for t in range(len(events))],
            "csv_rows": [{k: str(v) for k, v in r.items()} for r in rows],
        })
    fx = tmp_path / "fixture.json"
    fx.write_text(json.dumps({"sessions": sessions}))
    r = subprocess.run(["npx", "tsx", "scripts/check-features.ts", str(fx)], cwd=ROOT / "app",
                       capture_output=True, text=True)
    print(r.stdout, r.stderr)
    assert r.returncode == 0, r.stdout + r.stderr
