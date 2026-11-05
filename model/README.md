# model/

| Dosya | İçerik |
|---|---|
| `egitim_ayarlari.json` | Eğitimden önce sabitlenen eşik, kapılar ve model ayarları (ön kayıt) |
| `config.schema.json` | `config.json` çıkarım sözleşmesinin JSON Schema'sı |
| `gelistirme/` | **Reddedilmiş** v2.0 modeli ve model kartı (`gelistirme/README.md`). Yalnızca entegrasyon testi ve gölge mod içindir; yayınlanamaz. |

`model.onnx`, `config.json`, `metrics.json`, `model_version.json` ve model kartı bu klasörün köküne yalnızca `train.py` tüm kapıları (kabul) veya gerçek veri dışındaki tüm kapıları (`--aday`) geçtiğinde yazılır. Şu an kökte yayınlanabilir bir model **yoktur**: v2.0 metrik kapılarını geçmedi (bkz. `RELEASE.md`). Bu dosya da kabul edilmiş bir eğitimde model kartıyla değiştirilir.

## Bilinen sınırlama: kalibrasyon

Reddedilmiş v2.0 modelinin olasılıkları **kalibre değil**:

- Test kümesinde ortalama tahmin 0.491, gözlenen oran 0.341.
- Brier skoru 0.236; herkese sabit taban oranı söyleyen tahminci 0.225.

Çıktı bir sıralama puanı olarak kullanılabilir, "%x olasılık" olarak yorumlanamaz. Ayrıntı: `docs/MODEL_ROOT_CAUSE_ANALYSIS.md` (Neden 5). Bu not elle yazıldı; `gelistirme/README.md` ise `train.py`'nin ürettiği model kartıdır ve elle düzenlenmez.
