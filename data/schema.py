"""KARA KUTU v2.0 veri sözleşmesi: şema, sabitler ve referans özellik hesaplayıcı.

Bu modül spec.md §12–§13'ün çalıştırılabilir hâlidir. Tarayıcıdaki
app/src/ml/features.ts aynı formülleri uygular; ikisinin eşitliği
tests/integration/test_feature_contract.py ile denetlenir.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

RISKY_CHOICES = frozenset({"1A", "2A1", "2B2", "B"})

RISK_SCORE = {
    "1A": 1.0, "1B": 0.2,
    "2A1": 1.0, "2A2": 0.8,
    "2B1": 0.1, "2B2": 1.0,
    "A": 0.1, "B": 1.0,
}

CHOICES_BY_SCENE = {
    "K1": ("1A", "1B"),
    "K2_1A": ("2A1", "2A2"),
    "K2_1B": ("2B1", "2B2"),
    "K3": ("A", "B"),
}

CONCEPT_BY_SCENE = {
    "K1": "mimari",
    "K2_1A": "veri_test",
    "K2_1B": "veri_test",
    "K3": "guvenlik_kvkk",
}

# Modelin girdi sırası (spec.md §13). DEĞİŞTİRME: config.json ve tarayıcı bu sıraya bağlı.
FEATURES = [
    "decision_time_sec",
    "hesitation_count",
    "wrong_attempts_current_concept",
    "wrong_attempts_recent",
    "hint_usage_rate",
    "retry_count",
    "difficulty_level",
    "concept_mastery_rate",
    "recent_success_rate",
    "branch_risk_score",
    "consecutive_errors",
]

FEATURE_SPECS = {
    "decision_time_sec": {"unit": "saniye", "min": 0.0, "max": 300.0, "type": "float32"},
    "hesitation_count": {"unit": "adet", "min": 0.0, "max": 50.0, "type": "float32"},
    "wrong_attempts_current_concept": {"unit": "adet", "min": 0.0, "max": 20.0, "type": "float32"},
    "wrong_attempts_recent": {"unit": "adet", "min": 0.0, "max": 3.0, "type": "float32"},
    "hint_usage_rate": {"unit": "oran", "min": 0.0, "max": 1.0, "type": "float32"},
    "retry_count": {"unit": "adet", "min": 0.0, "max": 20.0, "type": "float32"},
    "difficulty_level": {"unit": "seviye (0=yeni,1=orta,2=deneyimli)", "min": 0.0, "max": 2.0, "type": "float32"},
    "concept_mastery_rate": {"unit": "oran", "min": 0.0, "max": 1.0, "type": "float32"},
    "recent_success_rate": {"unit": "oran", "min": 0.0, "max": 1.0, "type": "float32"},
    "branch_risk_score": {"unit": "puan", "min": 0.0, "max": 1.0, "type": "float32"},
    "consecutive_errors": {"unit": "adet", "min": 0.0, "max": 20.0, "type": "float32"},
}

LOGGED_ONLY = {
    "decision_change_count": {"min": 0.0, "max": 0.0},
    "previous_support_effectiveness": {"min": 0.0, "max": 1.0},
}

LABEL = "needs_learning_support"

CSV_COLUMNS = [
    "oturum_id", "karar_id", "oyun_no", "sahne_id", "concept_id", "secim_id",
    "riskli", "zaman_asimi",
    "decision_time_sec", "hesitation_count", "wrong_attempts_current_concept",
    "wrong_attempts_recent", "hint_usage_rate", "decision_change_count",
    "retry_count", "difficulty_level", "concept_mastery_rate", "recent_success_rate",
    "branch_risk_score", "consecutive_errors", "previous_support_effectiveness",
    "destek_verildi", "model_p", LABEL, "kaynak",
]

SOURCES = frozenset({"gercek", "sentetik"})

# Kişisel veri olabilecek sütun adları: bu adlardan biri görülürse veri reddedilir.
FORBIDDEN_COLUMNS = frozenset({
    "ad", "isim", "name", "soyad", "email", "eposta", "e_posta", "ip", "ip_adresi",
    "cihaz_id", "device_id", "konum", "location", "lat", "lon", "parola", "password",
    "telefon", "phone", "mesaj", "message",
})

DEFAULT_SUPPORT_EFFECTIVENESS = 0.5
MAX_DECISION_TIME = 300.0
TIMEOUT_SECONDS = 60.0


@dataclass
class DecisionEvent:
    """Bir kararın ham olayı. Tarayıcıdaki DecisionEvent ile alan alan aynıdır."""
    sahne_id: str
    secim_id: str
    zaman_asimi: bool
    decision_time_sec: float
    hesitation_count: int
    ipucu_kullandi: bool
    oyun_no: int  # 1'den başlar; retry_count = oyun_no - 1
    difficulty_level: int
    destek_verildi: bool = False

    @property
    def riskli(self) -> bool:
        return self.zaman_asimi or self.secim_id in RISKY_CHOICES


def compute_features(events: list[DecisionEvent], t: int) -> dict[str, float]:
    """t. kararın (0 tabanlı) özellikleri; yalnızca events[:t+1] kullanılır."""
    hist = events[: t + 1]
    e = hist[-1]
    concept = CONCEPT_BY_SCENE[e.sahne_id]
    same = [h for h in hist if CONCEPT_BY_SCENE[h.sahne_id] == concept]
    wrong_cc = sum(1 for h in same if h.riskli)
    recent = hist[-3:]
    wrong_recent = sum(1 for h in recent if h.riskli)
    consecutive = 0
    for h in reversed(hist):
        if not h.riskli:
            break
        consecutive += 1
    time_sec = TIMEOUT_SECONDS if e.zaman_asimi else e.decision_time_sec
    return {
        "decision_time_sec": float(min(max(time_sec, 0.0), MAX_DECISION_TIME)),
        "hesitation_count": float(min(e.hesitation_count, 50)),
        "wrong_attempts_current_concept": float(min(wrong_cc, 20)),
        "wrong_attempts_recent": float(wrong_recent),
        "hint_usage_rate": sum(1 for h in hist if h.ipucu_kullandi) / len(hist),
        "retry_count": float(min(e.oyun_no - 1, 20)),
        "difficulty_level": float(e.difficulty_level),
        "concept_mastery_rate": 1.0 - wrong_cc / len(same),
        "recent_success_rate": 1.0 - wrong_recent / len(recent),
        "branch_risk_score": RISK_SCORE[e.secim_id],
        "consecutive_errors": float(min(consecutive, 20)),
    }


def support_effectiveness(events: list[DecisionEvent], t: int) -> float:
    """Kaydedilen (modele girmeyen) sütun: destek verilen kararı izleyen kararların riskli olmayan oranı."""
    followers = [events[i + 1] for i in range(t) if events[i].destek_verildi]
    if not followers:
        return DEFAULT_SUPPORT_EFFECTIVENESS
    return sum(1 for f in followers if not f.riskli) / len(followers)


def label_for(events: list[DecisionEvent], t: int) -> Optional[int]:
    """spec.md §12: bir sonraki karar riskli ise 1, değilse 0, yoksa None."""
    if t + 1 >= len(events):
        return None
    return int(events[t + 1].riskli)
