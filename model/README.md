# Model kartı — kara-kutu-destek v2.0.0

> **Statü: REDDEDİLDİ.** Model, eğitimden önce sabitlenen kabul kapılarını geçmedi ve yalnızca sentetik veriyle eğitildi. Bu yüzden:
> - Hugging Face'e **yayınlanmadı**.
> - Uygulamada normal kullanıcıda yalnızca **gölge modda** çalışır: olasılık hesaplanır, oyun değişmez.
>
> Yapı Mitchell vd. (2019), *Model Cards for Model Reporting*'i izler.

## Dosyalar

| Dosya | Konum | Not |
|---|---|---|
| `model.onnx` | [`gelistirme/model.onnx`](gelistirme/model.onnx) | 912 bayt, SHA-256 `b91ba53e820ef6b5…` |
| `config.json` (sözleşme) | [`gelistirme/config.json`](gelistirme/config.json) | Özellik adları ve sırası, birimler, aralıklar, sınıf etiketleri, metrikler, eşik, SHA-256; şema: [`config.schema.json`](config.schema.json) |
| Metrikler | [`gelistirme/metrics.json`](gelistirme/metrics.json) | Kapı sonuçları dahil |
| Sürüm meta verisi | [`gelistirme/model_version.json`](gelistirme/model_version.json) | Kütüphane sürümleri, tohum, veri sürümü |
| `train.py`'nin ürettiği kart | [`gelistirme/README.md`](gelistirme/README.md) | Otomatik |
| Ön kayıt | [`egitim_ayarlari.json`](egitim_ayarlari.json) | Eşik ve kapılar, eğitimden önce (`6ffaaeb`) |

Kabul edilmiş bir model `model/` köküne yazılır. Kök bilerek boş: `train.py` kapı geçmeyen modeli köke yazmaz ve yayın betiği yalnızca kökteki **kabul** statüsündeki modeli yayınlar.

## Model ayrıntıları

- **Tür:** `StandardScaler` + `LogisticRegression(C=1.0, class_weight="balanced")`, scikit-learn 1.5.2 → ONNX (skl2onnx 1.17.0, opset 17 / ml 3).
- **Girdi:** 11 float32 özellik: karar süresi, tereddüt, kavramdaki ve son kararlardaki hatalar, ipucu oranı, tekrar sayısı, seviye, kavram hâkimiyeti, son başarı oranı, dal riski, ardışık hata. Tanımlar: `spec.md` §13, `data/SOZLUK.md`.
- **Çıktı:** `probabilities[:, 1]`. Bir sonraki kararda riskli seçim yapılmasına ilişkin bir puan. Eşik 0.65.
- **Tohum:** 20261104. Eğitim bayt bayt tekrarlanabilir.

## Amaçlanan kullanım

- **Amaç:** KARA KUTU oyununda, zorlanma işareti gösteren oyuncuya bir sonraki kararda ek açıklama ve tutor desteği vermek.
- **Kullanıcılar:** Oyunu oynayan yazılım mühendisliği öğrencileri ve oyunu geliştirenler.
- **Kullanılmaması gereken durumlar:**
  - not verme, sınav, öğrenci değerlendirme, işe alım
  - zekâ, kişilik veya ruh sağlığı çıkarımı
  - oyun dışında herhangi bir karar
  - gerçek bir hastane ya da sağlık sistemi (senaryo kurgudur)

## Faktörler

Performans seviye, tekrar oynama, karar süresi ve ipucu kullanımına göre belirgin farklılık gösteriyor (§ Nicel analiz). Cihaz türü önemli bir faktör: tereddüt fareyle ölçülür, telefonda düşük kalır.

## Metrikler ve kabul kapıları (test kümesi, eşik 0.65)

| Metrik | Değer | Kapı |
|---|---|---|
| Dengeli doğruluk | 0.527 | ≥ 0.70 ✗ |
| F1 | 0.245 | ≥ 0.65 ✗ |
| Recall | 0.171 | ≥ 0.70 ✗ |
| Precision | 0.429 | — |
| ROC-AUC | 0.651 | — |
| Karışıklık matrisi | TN 179 · FP 24 · FN 87 · TP 18 | — |
| Çapraz doğrulama dengeli doğruluk | 0.543 ± 0.032 | — |
| sklearn ↔ ONNX en büyük fark | 2.6e-7 | < 1e-4 ✓ |
| Gerçek oturum | 0 | ≥ 15 ✗ |

## Değerlendirme ve eğitim verisi

- **Veri:** 400 sentetik oturum, 2010 karar, 1610 etiketli (veri sürümü `7dae87520a30`). **Gerçek veri yok.**
- **Etiket:** Aynı oturumdaki bir sonraki karar riskli ise 1.
- **Bölme:** Oturum gruplu, katmanlı 5 kat; test kümesi 76 oturum / 308 satır.
- **Sentetik üretici:** `data/generate_synthetic.py`, tohum 20261104. Kuralları dosyanın başında.

## Nicel analiz

- **Tavan:** Gizli değişkeni kusursuz bilen bir tahminci bile eşik 0.65'te dengeli doğruluk 0.586'ya ulaşıyor. Bu hedef ve bu veriyle kapılar erişilemez.
- **Aşırı uyum yok:** AUC eğitimde 0.658, testte 0.651.
- **Kalibrasyon:** Ortalama tahmin 0.491, gözlenen oran 0.341. Brier skoru 0.236, sabit taban oran tahmincisi 0.225. Çıktı bir yüzde değil, bir sıralama puanıdır.
- **Kör noktalar:**
  - Hızlı karar veren oyuncularda kaçırılan destek oranı %96.6.
  - Her kararda ipucu kullananlarda gereksiz destek oranı %51.6.

Ayrıntılar: [`docs/MODEL_ROOT_CAUSE_ANALYSIS.md`](../docs/MODEL_ROOT_CAUSE_ANALYSIS.md).

## Etik değerlendirme

- Girdiler yalnızca oyun içi sayısal olaylar; kişisel veri yok.
- Çıkarım cihazda yapılır.
- Yanlış pozitif, oyuncuya gereksiz yardım ve "yetersiz görülme" hissi verebilir. Yanlış negatif görünmez ama desteği kaçırır.
- Uyarlama verilen oyuncuların sonraki seçimleri etiketleri etkiler (müdahale yanlılığı). Bu yüzden veri toplama gölge modda yapılır.

## Uyarılar ve öneriler

Model gerçek veri olmadan kabul edilemez. Sonraki sürüm için önerilen değişiklikler:
- hedef tanımı
- `next_scene` özelliği
- kalibre olasılıklar

Bunların hepsi gerçek veri görülmeden önce ön kayda alınmalıdır.

## Sürüm geçmişi

| Sürüm | Tarih | Not |
|---|---|---|
| 1.x | 2026-10 | Modelsiz, girişteki 3 soruya dayalı kural tabanlı uyarlama |
| 2.0.0 | 2026-11-04 | İlk model. **Reddedildi**; yalnızca gölge |
