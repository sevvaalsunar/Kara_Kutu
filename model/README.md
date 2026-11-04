# model/

| Dosya | İçerik |
|---|---|
| `egitim_ayarlari.json` | Eğitimden önce sabitlenen eşik, kapılar ve model ayarları (ön kayıt) |
| `config.schema.json` | `config.json` çıkarım sözleşmesinin JSON Schema'sı |
| `gelistirme/` | **Reddedilmiş** v2.0 modeli ve model kartı (`gelistirme/README.md`). Yalnızca entegrasyon testi ve gölge mod içindir; yayınlanamaz. |

`model.onnx`, `config.json`, `metrics.json`, `model_version.json` ve model kartı bu klasörün köküne yalnızca `train.py` tüm kapıları (kabul) veya gerçek veri dışındaki tüm kapıları (`--aday`) geçtiğinde yazılır. Şu an kökte yayınlanabilir bir model **yoktur**: v2.0 metrik kapılarını geçmedi (bkz. `RELEASE.md`). Bu dosya da kabul edilmiş bir eğitimde model kartıyla değiştirilir.
