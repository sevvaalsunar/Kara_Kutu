"""spec.md §12–§13 formüllerinin elle hesaplanmış örneklerle denetimi."""
from schema import DecisionEvent, compute_features, label_for, support_effectiveness


def ev(sahne, secim, t=10.0, hes=0, ipucu=False, oyun=1, lvl=1, timeout=False, destek=False):
    return DecisionEvent(sahne, secim, timeout, t, hes, ipucu, oyun, lvl, destek)


def test_riskli_tanimi_spec_4_ile_ayni():
    assert ev("K1", "1A").riskli and not ev("K1", "1B").riskli
    assert ev("K2_1A", "2A1").riskli and not ev("K2_1A", "2A2").riskli
    assert ev("K2_1B", "2B2").riskli and not ev("K2_1B", "2B1").riskli
    assert ev("K3", "B").riskli and not ev("K3", "A").riskli
    assert ev("K1", "1B", timeout=True).riskli  # süre dolması riskli sayılır


def test_etiket_bir_sonraki_karardan_gelir():
    es = [ev("K1", "1B"), ev("K2_1B", "2B2"), ev("K3", "A")]
    assert [label_for(es, t) for t in range(3)] == [1, 0, None]


def test_ozellikler_yalnizca_gecmisi_kullanir():
    es = [ev("K1", "1A", t=40, hes=1, ipucu=True)]
    f = compute_features(es, 0)
    assert f == {
        "decision_time_sec": 40.0, "hesitation_count": 1.0, "wrong_attempts_current_concept": 1.0,
        "wrong_attempts_recent": 1.0, "hint_usage_rate": 1.0, "retry_count": 0.0, "difficulty_level": 1.0,
        "concept_mastery_rate": 0.0, "recent_success_rate": 0.0, "branch_risk_score": 1.0, "consecutive_errors": 1.0,
    }
    # Gelecek karar eklemek t=0 özelliklerini değiştirmemeli (sızıntı yok)
    es.append(ev("K2_1A", "2A2", t=5))
    assert compute_features(es, 0) == f


def test_ikinci_oyun_ve_kavram_hakimiyeti():
    es = [ev("K1", "1A"), ev("K2_1A", "2A1"), ev("K3", "B"),
          ev("K1", "1B", oyun=2), ev("K2_1B", "2B1", oyun=2, ipucu=True)]
    f = compute_features(es, 4)
    assert f["retry_count"] == 1
    assert f["wrong_attempts_current_concept"] == 1  # veri_test kavramında 2A1
    assert f["concept_mastery_rate"] == 0.5
    assert f["wrong_attempts_recent"] == 1  # son 3: B, 1B, 2B1
    assert abs(f["recent_success_rate"] - 2 / 3) < 1e-12
    assert f["consecutive_errors"] == 0
    assert abs(f["hint_usage_rate"] - 0.2) < 1e-12


def test_zaman_asimi_60_sn_ve_kirpma():
    assert compute_features([ev("K1", "1A", t=5, timeout=True)], 0)["decision_time_sec"] == 60
    assert compute_features([ev("K1", "1B", t=999)], 0)["decision_time_sec"] == 300


def test_destek_etkinligi_varsayilan_ve_hesap():
    es = [ev("K1", "1A", destek=True), ev("K2_1A", "2A2"), ev("K3", "B", destek=True), ev("K1", "1A", oyun=2)]
    assert support_effectiveness(es, 0) == 0.5
    assert support_effectiveness(es, 2) == 1.0  # 1. destekten sonra 2A2 (riskli değil)
    assert support_effectiveness(es, 3) == 0.5  # 2A2 iyi, 1A riskli
