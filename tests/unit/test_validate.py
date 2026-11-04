"""validate_dataset.py geçersiz veriyi reddetmeli."""
import pandas as pd
import pytest

from generate_synthetic import generate
from validate_dataset import validate


@pytest.fixture(scope="module")
def good():
    return pd.DataFrame(generate(5, 1)).astype(str).replace("nan", "")


def test_gecerli_veri_gecer(good):
    assert validate(good) == []


def test_kisisel_veri_sutunu_reddedilir(good):
    assert any("Kişisel" in e for e in validate(good.assign(email="a@b.c")))


def test_eksik_sutun_reddedilir(good):
    assert any("Eksik sütun" in e for e in validate(good.drop(columns=["hint_usage_rate"])))


def test_aralik_disi_reddedilir(good):
    bad = good.copy()
    bad.loc[0, "hint_usage_rate"] = "1.5"
    assert any("aralığı dışında" in e for e in validate(bad))


def test_eksik_ozellik_reddedilir(good):
    bad = good.copy()
    bad.loc[0, "decision_time_sec"] = ""
    assert any("eksik veya sayısal değil" in e for e in validate(bad))


def test_gecersiz_kaynak_reddedilir(good):
    bad = good.copy()
    bad.loc[0, "kaynak"] = "uydurma"
    assert any("kaynak" in e for e in validate(bad))


def test_etiket_kurali_ihlali_yakalanir(good):
    bad = good.copy()
    i = bad.index[bad["needs_learning_support"] != ""][0]
    bad.loc[i, "needs_learning_support"] = "1" if bad.loc[i, "needs_learning_support"] == "0" else "0"
    assert any("etiket kuralı" in e for e in validate(bad))


def test_karisik_kaynakli_oturum_reddedilir(good):
    bad = good.copy()
    sid = bad.loc[0, "oturum_id"]
    bad.loc[(bad.oturum_id == sid) & (bad.karar_id == "1"), "kaynak"] = "gercek"
    assert any("karışık" in e for e in validate(bad))


def test_riskli_tutarsizligi_yakalanir(good):
    bad = good.copy()
    bad.loc[0, "riskli"] = "0" if bad.loc[0, "riskli"] == "1" else "1"
    assert validate(bad)
