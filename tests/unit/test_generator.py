"""Sentetik üretici deterministik olmalı ve asla 'gercek' yazmamalı."""
from generate_synthetic import generate


def test_ayni_tohum_ayni_veri():
    assert generate(30, 7) == generate(30, 7)


def test_farkli_tohum_farkli_veri():
    assert generate(30, 7) != generate(30, 8)


def test_hicbir_satir_gercek_degil():
    assert {r["kaynak"] for r in generate(50, 3)} == {"sentetik"}


def test_yollar_oyun_agacini_izler():
    rows = generate(50, 3)
    for a, b in zip(rows, rows[1:]):
        if a["oturum_id"] != b["oturum_id"]:
            continue
        if a["sahne_id"] == "K1":
            assert b["sahne_id"] == ("K2_1A" if a["secim_id"] == "1A" else "K2_1B")
        elif a["sahne_id"].startswith("K2"):
            assert b["sahne_id"] == "K3"
        else:
            assert b["sahne_id"] == "K1" and b["oyun_no"] == a["oyun_no"] + 1
