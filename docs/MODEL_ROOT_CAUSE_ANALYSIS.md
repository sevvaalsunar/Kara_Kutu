# Model kök neden analizi — v2.0 kabul kapısı neden geçmedi?

Tarih: 2026-11-04 · Kaynak: `analysis/kok_neden.py` → `analysis/kok_neden_sonuclari.json`, `data/tavan_analizi.json`
Bu analiz yalnızca **teşhistir**. Eşik, kapılar, etiket tanımı ve yayın verisi değiştirilmedi. Statü **reddedildi** olarak kalır.

## 1. Mevcut sonuç

| Metrik (test, eşik 0.65) | Değer | Kapı |
|---|---|---|
| Dengeli doğruluk | 0.527 | ≥ 0.70 ✗ |
| F1 | 0.245 | ≥ 0.65 ✗ |
| Recall (destek) | 0.171 | ≥ 0.70 ✗ |
| ROC-AUC | 0.651 | — |
| Karışıklık matrisi | TN 179 · FP 24 · FN 87 · TP 18 (n = 308, 76 oturum) | — |
| Gerçek oturum | 0 | ≥ 15 ✗ |

Test dengeli doğruluğunun oturum bazlı önyükleme (1000 tekrar) %95 aralığı **[0.477, 0.572]**. 0.70 bu aralığın çok dışında olduğundan başarısızlık şans eseri bir bölmeden kaynaklanmıyor.

## 2. Veri bileşimi ve etiket dağılımı

400 sentetik oturum, 2010 satır, 1610 etiketli. 0 gerçek oturum. Pozitif oran 0.381; sınıflar orta derecede dengesiz, model `class_weight="balanced"` ile eğitildi.

Etiketin taban oranı **bir sonraki sahneye** göre belirgin değişiyor:

| Sonraki sahne | n | Pozitif oran |
|---|---|---|
| K1 (yeni oyun) | 270 | 0.296 |
| K2_1A | 251 | 0.478 |
| K2_1B | 419 | 0.294 |
| K3 | 670 | 0.434 |

## 3. Olası nedenler ve kanıtlar

### Neden 1 — Hedef tek bir gürültülü olaydır (ANA NEDEN)

`needs_learning_support` tek bir sonraki karardır: oyuncunun durumu tam bilinse bile sonuç bir yazı-turadır.

**Kanıt:** Üreticinin gizli zorlanma değişkenini kusursuz bilen Bayes-optimal tahminci bile eşik 0.65'te dengeli doğruluk 0.586, F1 0.330, recall 0.210'a ulaşıyor. En iyi eşikte bile (0.37) 0.676'da kalıyor; ROC-AUC tavanı 0.736. Kapılar, **hiçbir modelin** bu veride ulaşamayacağı bir yerde.

### Neden 2 — Özelliklerin ayrıştırıcılığı zayıf (üretici varsayımı)

Tüm özelliklerde iki sınıf arasındaki standartlaştırılmış fark (Cohen d) küçük:

| Özellik | ort (0) | ort (1) | d |
|---|---|---|---|
| `recent_success_rate` | 0.657 | 0.511 | −0.38 |
| `branch_risk_score` | 0.473 | 0.615 | 0.35 |
| `wrong_attempts_recent` | 0.785 | 1.047 | 0.30 |
| `consecutive_errors` | 0.491 | 0.783 | 0.29 |
| `concept_mastery_rate` | 0.648 | 0.522 | −0.29 |
| `hesitation_count` | 1.97 | 2.43 | 0.28 |
| `decision_time_sec` | 22.0 | 26.7 | 0.27 |
| `hint_usage_rate` | 0.412 | 0.509 | 0.27 |
| `wrong_attempts_current_concept` | 0.514 | 0.656 | 0.23 |
| `retry_count` | 0.493 | 0.397 | −0.15 |
| `difficulty_level` | 1.017 | 1.073 | 0.07 |

En iyi tek özelliğin AUC'si 0.605. Bu zayıflık sentetik üreticinin varsayımıdır (gürültü düzeyi, gizli değişkenle ilişkilerin gücü). Gerçek oyuncularda sinyal daha güçlü ya da daha zayıf olabilir; **ölçülmeden bilinemez.**

### Neden 3 — Sabit 0.65 eşiği, sıkışık olasılık dağılımıyla uyuşmuyor

Zayıf sinyal ve dengeli sınıf ağırlıkları, olasılıkları 0.5 çevresine sıkıştırıyor. Test kümesinde medyan 0.476, %90'lık dilim 0.676; tahminlerin yalnızca **%13.6'sı** 0.65'i geçiyor. Bu yüzden recall düşük kalıyor.

Teşhis için farklı eşiklerdeki dengeli doğruluk (bunlar **kapı değildir** ve eşik değiştirilmemiştir):

| Eşik | 0.40 | 0.50 | 0.55 | 0.60 | **0.65** |
|---|---|---|---|---|---|
| Dengeli doğruluk | 0.587 | 0.635 | 0.613 | 0.557 | **0.527** |
| Recall | 0.838 | 0.619 | 0.467 | 0.267 | **0.171** |

En iyi eşikte bile 0.70'e ulaşılmıyor. Eşik sorunu ana nedeni ağırlaştırıyor ama tek başına açıklamıyor.

### Neden 4 — Bağlamsal bilgi eksik (sonraki sahne)

§2'deki tablo, etiketin taban oranının sonraki sahneye göre 0.29 ile 0.48 arasında değiştiğini gösteriyor. Sonraki sahne tahmin anında bilinir (seçimden belirlenir) ama modele doğrudan verilmiyor; yalnızca `branch_risk_score` üzerinden dolaylı olarak var. Bu, gelecekteki bir sürüm için ön kayıt adayıdır. Burada eklenmedi, çünkü sonuçlar görüldükten sonra özellik eklemek kapıyı anlamsızlaştırır.

## 4. Elenen nedenler

| Aday neden | Sonuç | Kanıt |
|---|---|---|
| Veri miktarı | **Neden değil** | Aynı üreticiden 400 → 1600 → 6400 oturum, bağımsız 5000 oturumluk testte ROC-AUC 0.669 → 0.670 → 0.671; dengeli doğruluk 0.567 → 0.561 → 0.567. Öğrenme eğrisi düz. |
| Model sınıfı | **Neden değil** | Gradient boosting (6400 oturum) ROC-AUC 0.682, lojistik 0.671. Esnek bir model de tavanın (0.736) altında kalıyor. |
| Sızıntı | **Yok** | Eğitim ve test oturumları ayrık (gruplu bölme); en yüksek tek özellik AUC'si 0.605 ≤ 0.98. Özellikler yalnızca `t` anına kadarki olaylardan, etiket `t+1`'den. TS↔Python sözleşme testi aynı formülleri doğruluyor. |
| Bölme kararsızlığı | **Neden değil** | Çapraz doğrulama 0.543 ± 0.032; bootstrap aralığı 0.70'i içermiyor. |
| Uygulama hatası | **Yok** | sklearn ↔ ONNX farkı 2.6e-7; Python ↔ tarayıcı farkı 0 (5/5). Model, eğitildiği şeyi doğru çalıştırıyor. |

## 5. Hedef tanımının değerlendirilmesi

**Mevcut hedef korunuyor (v2.0).** Ürün açısından savunulabilir: "bir sonraki kararda zorlanacak mı?" tam olarak desteğin verileceği an ile örtüşüyor. Sorun hedefin anlamı değil, tek bir olayın gürültüsü. Hedefi sonuç gördükten sonra değiştirmek yerine v2.0 reddedildi olarak bırakıldı.

**v2.1 için önerilen alternatif (ölçülmedi, ön kayıt bekliyor):**

> `needs_learning_support_v21` = aynı oyunun **kalan kararlarından en az biri** riskli ise 1.

- **Ürün gerekçesi:** Destek yalnızca bir sonraki karar için değil, oyunun geri kalanı için verilir. Tutor ve kavram özeti etkisini birden fazla kararda gösterir.
- **Beklenen etki:** Birden fazla olay birleştiği için etiket gürültüsü azalır.
- **Riskler:**
  - K3 satırlarında kalan karar yoktur; yeni oyunla ilişki tanımlanmalıdır.
  - Pozitif oran artar; kapıların taban oranla birlikte yeniden düşünülmesi gerekir.
  - Etiket, uyarlamanın kendi etkisini daha uzun bir pencerede içerir; gölge modda toplanmış veri şarttır.
  - Hedef değişince eski sonuçlarla karşılaştırma bozulur.

Bu alternatifin metrikleri **bilerek hesaplanmadı**. Önce hesaplayıp sonra seçmek, kapıyı geçecek hedefi aramak olurdu.

## 6. Düzeltici eylemler (sırayla)

1. **Gerçek veri topla** (`?veri=1`, gölge mod). Gerçek davranıştaki sinyal ölçülmeden hiçbir hedef ya da model kararı anlamlı değildir. Hat tarayıcıda uçtan uca doğrulandı.
2. **v2.1 ön kaydı.** Gerçek veriye bakmadan önce spec'e ve `egitim_ayarlari.json`'a yazılmalı:
   - Hedef: mevcut hedef ya da §5'teki öneri; biri seçilmeli.
   - Ek özellik: `next_scene` (tek sıcak kodlanmış).
   - Eşik politikası: sabit 0.65 korunabilir; ya da kalibrasyon yöntemi ve eşik ön kayıtta açıkça tanımlanmalı.
   - Gerekçe: bu belge.
3. Gerçek veriyle yeniden eğitim. Kapılar geçerse **kabul**, geçmezse sonuç yine kaydedilir.

## 7. Değişiklik yapmanın riskleri

- Sonuçları gördükten sonra eşik, hedef veya özellik seçmek kabul kapısını anlamsızlaştırır (çoklu karşılaştırma, test kümesine uydurma).
- Sentetik veride iyileşme, gerçek oyunculardaki başarıyı kanıtlamaz; üreticinin varsayımları değiştirilirse metrikler istenen her yere götürülebilir.
- Uyarlamalı destek etiketleri etkiler (müdahale yanlılığı). Bu yüzden veri toplama gölge modda yapılır.
