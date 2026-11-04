"""Yayın betiği kabul edilmemiş modeli asla yayınlamamalı."""
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def test_reddedilmis_veya_eksik_model_yayinlanamaz():
    r = subprocess.run([sys.executable, str(ROOT / "scripts" / "publish_hf.py"), "--repo", "x/y", "--kuru"],
                       capture_output=True, text=True)
    assert r.returncode == 1 and "REDDEDİLDİ" in r.stdout
