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

### Neden 5 — Olasılıklar kalibre değil (`class_weight="balanced"`)

Dengeli sınıf ağırlıkları, tahminleri azınlık sınıfına doğru kaydırır. Test kümesinde:

| | Değer |
|---|---|
| Ortalama tahmin | 0.491 |
| Gözlenen pozitif oran | 0.341 |
| Brier skoru (model) | 0.236 |
| Brier skoru (herkese taban oranı söyleyen sabit tahminci) | 0.225 |

| Tahmin aralığı | n | Ortalama tahmin | Gözlenen oran |
|---|---|---|---|
| 0.2–0.3 | 15 | 0.267 | 0.133 |
| 0.3–0.4 | 70 | 0.357 | 0.214 |
| 0.4–0.5 | 87 | 0.443 | 0.264 |
| 0.5–0.6 | 77 | 0.552 | 0.481 |
| 0.6–0.7 | 36 | 0.648 | 0.500 |
| 0.7–0.8 | 16 | 0.741 | 0.562 |
| 0.8–0.9 | 7 | 0.827 | 0.143 |

Model sıralamada taban orandan iyi (AUC 0.651), ama olasılık olarak taban orandan kötü. Sonuç: spec §14'teki "P(needs_learning_support = 1)" yorumu bu model için geçerli değil. Panelde "p = 0.73" görünmesi "%73 olasılık" anlamına gelmez. 0.65 eşiği de kalibre olmayan bir puana uygulanıyor.

v2.1 ön kayıt adayı: `class_weight` olmadan eğitim ya da açıkça tanımlanmış bir kalibrasyon adımı, ve kalibrasyon için bir kabul ölçütü (örneğin Brier skoru taban orandan iyi). Bu bulgu v2.0'da modeli veya eşiği **değiştirmez**.

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
   - Kalibrasyon: `class_weight="balanced"` yerine kalibre olasılıklar ve bir kalibrasyon kabul ölçütü (Neden 5).
   - Gerekçe: bu belge.
3. Gerçek veriyle yeniden eğitim. Kapılar geçerse **kabul**, geçmezse sonuç yine kaydedilir.

## 7. Değişiklik yapmanın riskleri

- Sonuçları gördükten sonra eşik, hedef veya özellik seçmek kabul kapısını anlamsızlaştırır (çoklu karşılaştırma, test kümesine uydurma).
- Sentetik veride iyileşme, gerçek oyunculardaki başarıyı kanıtlamaz; üreticinin varsayımları değiştirilirse metrikler istenen her yere götürülebilir.
- Uyarlamalı destek etiketleri etkiler (müdahale yanlılığı). Bu yüzden veri toplama gölge modda yapılır.

## 8. Profil bazlı hata analizi (sentetik test kümesi)

Kaynak: `analysis/profil_analizi.py` → `analysis/profil_analizi.json`. Yalnızca teşhis; tüm veriler **sentetik**, gerçek oyuncu davranışı hakkında bir şey kanıtlamaz.

### Aşırı uyum yok, sinyal zayıf

| | ROC-AUC | Dengeli doğruluk | Destek oranı |
|---|---|---|---|
| Eğitim | 0.658 | 0.555 | 0.140 |
| Test | 0.651 | 0.527 | 0.136 |

E�itim ile test arasındaki fark küçük. Sorun ezberleme değil, yetersiz uyum: 11 katsayılı lojistik modelde bu beklenen bir durum.

### Modelin nerede doğru, nerede yanlış olduğu

| Profil (test) | n | Sonraki karar riskli | Destek verildi | Kaçırılan destek (FN) | Gereksiz destek (FP) |
|---|---|---|---|---|---|
| Karar süresi < 15 sn | 116 | %25 | %2.6 | %96.6 | %2.3 |
| Karar süresi ≥ 30 sn | 79 | %42 | %34 | %66.7 | %34.8 |
| İpucu hiç kullanılmadı | 90 | %22 | %2.2 | %95 | %1.4 |
| İpucu her kararda | 51 | %39 | %51 | %50 | %51.6 |
| Bu karar güvenli | 174 | %25 | %2.3 | %100 | %3.1 |
| Bu karar riskli | 134 | %46 | %28 | %71 | %27.8 |
| Ardışık hata ≥ 2 | 38 | %58 | %32 | %63.6 | %25 |
| Tekrar oyun (retry ≥ 1) | 116 | %33 | %9.5 | %86.8 | %7.7 |
| Deneyimliyim | 106 | %33 | %15 | %74.3 | %9.9 |

**Kör noktalar:**
1. **Hızlı ama yanlış oyuncu.** Model büyük ölçüde süre ve ipucu kullanımına dayanıyor. Hızlı karar veren ve ipucu kullanmayan oyuncu sonraki kararda zorlansa bile neredeyse hiç destek almıyor (FN %96.6). Kendinden emin ama yanılan öğrenci tam da bu profile uyar.
2. **İpucu kullanımı desteği kendi kendine çağırıyor.** Her kararda ipucu açanların yarısına destek veriliyor ve bunların yarısı gereksiz (FP %51.6). Yardım isteyen, ihtiyacı olmasa da daha çok yardım alıyor.
3. **Zorlanma sürünce destek düşebilir.** Ardışık iki hatadan sonra bile destek oranı yalnızca %32. UX turunda bu, desteğin geri çekilmesi olarak görüldü. Ürün kuralıyla ele alındı (spec §14 madde 4); model değişmedi.

### Örnekleme yanlılığı riskleri

- Sentetik veride seviyeler neredeyse eşit dağılıyor (%32 / %32 / %36). Gerçek sınıfta "Yeni başladım" ve "Biraz deneyimim var" baskın olabilir.
- Oturum başına ortalama 5.0 karar var; gerçek katılımcılar daha az tekrar oynayabilir. Bu, etiketli satır sayısını azaltır.
- Tereddüt sayısı fareyle ölçülür. Telefonla oynayan katılımcılarda sistematik olarak düşük kalır; dağılım kayması yaratır.
- 15 gerçek oturum yaklaşık 50–75 etiketli satır demektir. Bu boyutta 5 katlı gruplu değerlendirmenin güven aralığı çok geniş olur. 15, kabul için **alt sınırdır**, yeterlilik garantisi değil.

### v2.1 için ek ön kayıt adayları (uygulanmadı)

- "Hızlı ve riskli" etkileşim terimi.
- `next_scene` özelliği.
- İpucu kullanımının etiketten ayrıştırılması (ipucunu desteğin sonucu değil, isteği olarak modellemek).

Hiçbiri gerçek veri görülmeden ve ön kayıt yapılmadan uygulanmaz.
