# SÖZLÜK — oturumlar.csv

Her satır bir karardır. Ayrıntılı formüller: `spec.md` §12–§13; çalıştırılabilir referans: `data/schema.py` (Python) ve `app/src/ml/features.ts` (tarayıcı). İkisinin eşitliği `tests/integration/test_feature_contract.py` ile denetlenir.

| Sütun | Tür | Birim / değerler | Modele girer | Tanım |
|---|---|---|---|---|
| `oturum_id` | metin | 12 karakter `[a-z0-9]` | hayır | Sayfa açılışında rastgele üretilen kimlik. Kişiyle ilişkilendirilemez. "Baştan oyna" aynı oturumda kalır. |
| `karar_id` | tamsayı | 1, 2, … | hayır | Oturumdaki kararın sırası |
| `oyun_no` | tamsayı | 1, 2, … | hayır | Oturumdaki oyun sırası |
| `sahne_id` | metin | `K1`, `K2_1A`, `K2_1B`, `K3` | hayır | Karar düğümü |
| `concept_id` | metin | `mimari`, `veri_test`, `guvenlik_kvkk` | hayır | Düğümün kavramı |
| `secim_id` | metin | `1A` `1B` `2A1` `2A2` `2B1` `2B2` `A` `B` | hayır | Seçilen seçenek |
| `riskli` | 0/1 | | hayır | Seçim `1A`, `2A1`, `2B2`, `B` ise veya süre dolduysa 1 |
| `zaman_asimi` | 0/1 | | hayır | "Deneyimliyim"de süre doldu ve ICU-Net karar verdi |
| `decision_time_sec` | ondalık | sn, 0–300 | **evet** | Karar ekranı açılışından seçime; süre dolduysa 60 |
| `hesitation_count` | tamsayı | 0–50 | **evet** | A↔B kartları arasında fare/odak geçişi + ipucu panelini açıp kapama |
| `wrong_attempts_current_concept` | tamsayı | 0–20 | **evet** | Bu kavramda (bu karar dahil) riskli seçim sayısı |
| `wrong_attempts_recent` | tamsayı | 0–3 | **evet** | Son 3 kararda riskli seçim sayısı |
| `hint_usage_rate` | oran | 0–1 | **evet** | Oyuncunun ipucunu kendisi açtığı veya tutor'a yazdığı kararların oranı |
| `decision_change_count` | tamsayı | her zaman 0 | hayır | Şema uyumu için. Spec §2 kararı geri almayı yasaklar. |
| `retry_count` | tamsayı | 0–20 | **evet** | `oyun_no − 1` |
| `difficulty_level` | tamsayı | 0, 1, 2 | **evet** | Yeni başladım / Biraz deneyimim var / Deneyimliyim |
| `concept_mastery_rate` | oran | 0–1 | **evet** | Bu kavramda riskli olmayan seçim oranı |
| `recent_success_rate` | oran | 0–1 | **evet** | Son 3 kararda riskli olmayan seçim oranı |
| `branch_risk_score` | ondalık | 0–1 | **evet** | Seçimin yazar tanımlı risk puanı (`1A` 1.0, `1B` 0.2, `2A1` 1.0, `2A2` 0.8, `2B1` 0.1, `2B2` 1.0, `A` 0.1, `B` 1.0) |
| `consecutive_errors` | tamsayı | 0–20 | **evet** | Geriye doğru kesintisiz riskli seçim sayısı |
| `previous_support_effectiveness` | oran | 0–1 | hayır (v2.1 adayı) | Destek verilen kararları izleyen kararların riskli olmayan oranı; destek yoksa 0.5 |
| `destek_verildi` | 0/1 | | hayır | Bu karar ekranında uyarlamalı destek gösterildi mi |
| `model_p` | ondalık / boş | 0–1 | hayır | Bu karar için modelin olasılığı (gölge modda da yazılır); model çalışmadıysa boş |
| `needs_learning_support` | 0/1 / boş | | **etiket** | Aynı oturumdaki bir sonraki karar riskli ise 1; sonraki karar yoksa boş (eğitime girmez) |
| `kaynak` | metin | `gercek`, `sentetik`, `test` | hayır | Satırın kökeni. `test`: `?test=1` ile oynanmış doğrulama oturumu; birleştirici ve eğitim reddeder. |

**Kaydedilmeyenler:** ad, e-posta, cihaz kimliği, IP, konum, parola, tarayıcı parmak izi, tutor'a yazılan mesajların metni, zaman damgası.
