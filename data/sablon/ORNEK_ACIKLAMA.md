# Açıklamalı örnek satır

`ORNEK_test_oturumu.csv` gerçek uygulamada, gerçek tarayıcıda (headless Chromium) oynanmış bir **test** oturumudur 
(`tools/browser-e2e/ornek-oturum.mjs`). `kaynak=test` olduğu için birleştirici reddeder; gerçek veri değildir. 
Bu sayfa o dosyanın **ilk satırını** sütun sütun açıklar (otomatik üretildi).

Oynanış: Biraz deneyimim var · Karar 1'de 40 sn bekledi, ipucunu açtı, 1A'yı seçti · aynı oturumda ikinci kez oynadı (6 karar).

| Sütun | Değer | Modele girer | Anlamı |
|---|---|---|---|
| `oturum_id` | `zeebua3r84m3` | hayır | Sayfa açılışında rastgele üretilen kimlik. Kişiyle ilişkilendirilemez. "Baştan oyna" aynı oturumda kalır. |
| `karar_id` | `1` | hayır | Oturumdaki kararın sırası |
| `oyun_no` | `1` | hayır | Oturumdaki oyun sırası |
| `sahne_id` | `K1` | hayır | Karar düğümü |
| `concept_id` | `mimari` | hayır | Düğümün kavramı |
| `secim_id` | `1A` | hayır | Seçilen seçenek |
| `riskli` | `1` |  |  |
| `zaman_asimi` | `0` |  |  |
| `decision_time_sec` | `40` | **evet** | Karar ekranı açılışından seçime; süre dolduysa 60 |
| `hesitation_count` | `1` | **evet** | A↔B kartları arasında fare/odak geçişi + ipucu panelini açıp kapama |
| `wrong_attempts_current_concept` | `1` | **evet** | Bu kavramda (bu karar dahil) riskli seçim sayısı |
| `wrong_attempts_recent` | `1` | **evet** | Son 3 kararda riskli seçim sayısı |
| `hint_usage_rate` | `1` | **evet** | Oyuncunun ipucunu kendisi açtığı veya tutor'a yazdığı kararların oranı |
| `decision_change_count` | `0` | hayır | Şema uyumu için. Spec §2 kararı geri almayı yasaklar. |
| `retry_count` | `0` | **evet** | `oyun_no − 1` |
| `difficulty_level` | `1` | **evet** | Yeni başladım / Biraz deneyimim var / Deneyimliyim |
| `concept_mastery_rate` | `0` | **evet** | Bu kavramda riskli olmayan seçim oranı |
| `recent_success_rate` | `0` | **evet** | Son 3 kararda riskli olmayan seçim oranı |
| `branch_risk_score` | `1` | **evet** | Seçimin yazar tanımlı risk puanı (`1A` 1.0, `1B` 0.2, `2A1` 1.0, `2A2` 0.8, `2B1` 0.1, `2B2` 1.0, `A` 0.1, `B` 1.0) |
| `consecutive_errors` | `1` | **evet** | Geriye doğru kesintisiz riskli seçim sayısı |
| `previous_support_effectiveness` | `0.5` | hayır (v2.1 adayı) | Destek verilen kararları izleyen kararların riskli olmayan oranı; destek yoksa 0.5 |
| `destek_verildi` | `0` |  |  |
| `model_p` | `0.730346` | hayır | Bu karar için modelin olasılığı (gölge modda da yazılır); model çalışmadıysa boş |
| `needs_learning_support` | `1` |  |  |
| `kaynak` | `test` | hayır | Satırın kökeni. `test`: `?test=1` ile oynanmış doğrulama oturumu; birleştirici ve eğitim reddeder. |

**Dikkat edilecekler:**

- `needs_learning_support` bu satırda 1: aynı oturumdaki bir sonraki karar (2A1) riskli. Son satırda boştur (sonraki karar yok).
- `model_p` doludur çünkü veri toplama modu gölgede çalışır: olasılık hesaplanır ama oyun değişmez (`destek_verildi`=0).
- Ad, e-posta, cihaz, IP, konum ve tutor mesajı sütunu yoktur; doğrulayıcı böyle bir sütun görürse dosyayı reddeder.
