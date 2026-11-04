---
license: apache-2.0
library_name: onnx
tags: [tabular-classification, education, onnx, sklearn]
---

# kara-kutu-destek · v2.0.0

> Statü: **REDDEDILDI**. Metrik kabul kapıları GEÇMEDİ. Bu yapıt yalnızca entegrasyon testi ve gölge mod içindir; yayınlanmamalı ve oyunu değiştirmemelidir.

KARA KUTU (YZM301 SE Primer) oyununda, oyuncunun bir sonraki kararında riskli seçeneği seçme olasılığını tahmin eden küçük bir lojistik regresyon modeli. Olasılık 0.65 eşiğini geçerse oyun ek açıklama ve tutor desteği sunar (spec.md §14).

## Amaç ve kapsam

- **Amaç:** Oyun içinde zorlanma işaretlerine göre öğrenme desteğini artırmak.
- **Hedef kullanıcı:** KARA KUTU oyuncuları (yazılım mühendisliği öğrencileri) ve oyunu geliştirenler.
- **Kapsam dışı:** Not verme, öğrenci değerlendirme, işe alım, zekâ/kişilik/ruh sağlığı çıkarımı, oyun dışı her kullanım. Model bir kişinin yeteneğini ölçmez; yalnızca bu oyundaki bir sonraki seçimi tahmin eder.

## Veri

| | Değer |
|---|---|
| Veri seti sürümü | `7dae87520a30` |
| Gerçek oturum | 0 |
| Sentetik oturum | 400 |
| Etiketli satır (gerçek / sentetik) | 0 / 1610 |
| Pozitif oran | 0.3814 |

Sentetik veri `data/generate_synthetic.py` (tohum 20261104) ile, belgelenmiş varsayımlara göre üretildi. **Sentetik veri gerçek oyuncu davranışının yerine geçmez;** buradaki metrikler, modelin üreticinin varsaydığı ilişkileri ne kadar geri kazandığını gösterir, gerçek oyunculardaki başarıyı değil.

Etiket: aynı oturumdaki bir sonraki karar riskli ise 1 (spec.md §12).

## Eğitim

`StandardScaler` + `LogisticRegression(C=1.0, class_weight="balanced")`, scikit-learn 1.5.2. Bölme: oturum gruplu, katmanlı 5 kat; ilk kat test. ONNX: skl2onnx 1.17.0, opset 17 / ml 3.

## Değerlendirme (test kümesi, eşik 0.65)

| Metrik | Değer |
|---|---|
| Dengeli doğruluk | 0.5266 |
| F1 | 0.2449 |
| Recall (destek) | 0.1714 |
| Precision | 0.4286 |
| ROC-AUC | 0.6512 |
| Karışıklık matrisi | TN 179 · FP 24 · FN 87 · TP 18 |
| Çapraz doğrulama (eğitim, 4 kat) dengeli doğruluk | 0.5425 ± 0.0323 |

### Kabul kapıları

| Kapı | Sonuç | Değer | Koşul |
|---|---|---|---|
| balanced_accuracy | GEÇMEDİ | 0.5266 | >= 0.7 |
| f1 | GEÇMEDİ | 0.2449 | >= 0.65 |
| recall | GEÇMEDİ | 0.1714 | >= 0.7 |
| sizinti_grup | GEÇTİ | ayrık | eğitim/test oturumları ayrık |
| sizinti_tek_ozellik | GEÇTİ | 0.605 | <= 0.98 |
| veri_gecerliligi | GEÇTİ | geçerli | eksik/aralık dışı satır yok |
| onnx_parite | GEÇTİ | 2.625e-07 | < 0.0001 |
| gercek_veri | GEÇMEDİ | 0 | >= 15 gerçek oturum |

### Katsayılar (standartlaştırılmış özellikler)

| Özellik | Katsayı |
|---|---|
| `recent_success_rate` | -0.514 |
| `concept_mastery_rate` | +0.338 |
| `wrong_attempts_current_concept` | +0.281 |
| `retry_count` | -0.228 |
| `hint_usage_rate` | +0.222 |
| `decision_time_sec` | +0.166 |
| `hesitation_count` | +0.166 |
| `wrong_attempts_recent` | -0.154 |
| `difficulty_level` | +0.153 |
| `branch_risk_score` | -0.021 |
| `consecutive_errors` | +0.001 |

## Sınırlamalar ve bilinen hata durumları

- Gerçek veri yokken metrikler yalnızca sentetik üretici varsayımlarını yansıtır.
- Oturum başına ortalama 4–5 karar vardır; ilk kararda geçmiş yoktur, tahmin büyük ölçüde süre, tereddüt ve seçimin riskine dayanır.
- Tereddüt sayısı fareyle ölçülür; dokunmatik ekranda kart üzerinde gezinme olmadığı için düşük kalır. Aynı davranış telefonda daha düşük olasılık üretebilir.
- Uyarlama verilen oyuncuların sonraki seçimleri müdahaleden etkilenir; bu yüzden veri toplama modu gölge modda çalışır (spec.md §15).
- Uzun süre başka sekmede kalmak karar süresini yapay olarak artırır ve yanlış pozitif üretebilir.

## Gizlilik ve etik

Girdi yalnızca oyun içi sayısal olaylardır. Ad, e-posta, cihaz kimliği, IP, konum ve serbest metin toplanmaz. Çıkarım tarayıcıda yapılır; oyuncu verisi cihazdan çıkmaz. Model kişiler hakkında karar vermek için kullanılmamalıdır.

## Sürüm geçmişi

| Sürüm | Not |
|---|---|
| 2.0.0 | İlk adaptif sürüm (`reddedildi`), veri `7dae87520a30` |
