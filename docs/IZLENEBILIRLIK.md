# Ödev gereksinimleri izlenebilirlik tablosu — v2.0

Kaynak: v2.0 ödev talimatı (Adaptive The Primer). Statüler: PASS · FAIL · BLOCKED · REQUIRES HUMAN ACTION. Kanıt dosyaları `docs/kanit/` altındadır.

| # | Gereksinim | Uygulanan çözüm | Dosya(lar) | Test kanıtı | Statü |
|---|---|---|---|---|---|
| 1 | Mevcut Primer korunur, regresyon bozulmaz | v1 oyunu, 8 yol, 2 son ve `data-testid` sözleşmesi değişmedi; uyarlama ek katman | `app/src/`, `app/cypress/e2e/yollar.cy.js`, `kabul.cy.js` | Gerçek Chromium: dev 19/19, üretim 19/19 (`tarayici-dev-v1.json`, `tarayici-uretim-v1.json`) | PASS |
| 2 | spec.md eğitimden önce güncellenir | §11–§20; eşik ve kapılar `egitim_ayarlari.json`'da | `spec.md`, `model/egitim_ayarlari.json` | Commit `6ffaaeb` eğitimden önce | PASS |
| 3 | 3 yeni çalıştırılabilir kabul senaryosu | KÖ6 (zorlanan), KÖ7 (akıcı), KÖ8 (model yoksa oyun bozulmaz), KÖ9 (parite) | `spec.md` §20, `adaptif.cy.js`, `model.cy.js`, `parite.cy.js` | Gerçek tarayıcıda geçti (`tarayici-*-v2.json`) | PASS |
| 4 | Küçük tablo modeli, sklearn → ONNX → ORT-web | StandardScaler + LogisticRegression, skl2onnx, onnxruntime-web 1.30.0 | `train.py`, `app/src/ml/modelRuntime.ts` | sklearn↔ONNX farkı 2.6e-7; tarayıcıda yükleme ve çıkarım | PASS |
| 5 | Model gerçek oynanışı değiştirir | p ≥ 0.65 → kavram özeti, sonraki kararda tutor ve ek destek, 90 sn sayaç | `App.tsx`, `ResultView.tsx`, `DecisionView.tsx` | KÖ6/KÖ7 gerçek oyun akışıyla geçti | PASS (mekanizma). Model kabul edilmediği için normal kullanıcıda gölge |
| 6 | Kişisel veri toplanmaz | Yalnızca sayısal oyun olayları; doğrulayıcı PII sütunlarını reddeder; veri sunucuya gitmez | `telemetry.ts`, `validate_dataset.py`, spec §15 | `test_validate.py`, veri hattı tarayıcı testi | PASS |
| 7 | `data/oturumlar.csv`, `SOZLUK.md`, `data/README.md` | Belgelenmiş 25 sütunluk şema; şablon ve açıklamalı örnek | `data/` | Doğrulayıcı GEÇERLİ | PASS |
| 8 | `kaynak` gercek/sentetik ayrımı | Ek olarak `test` değeri; birleştirici ve eğitim test satırlarını reddeder | `schema.py`, `birlestir.py`, `train.py` | `test_birlestir.py`, `test_train_robustness.py`, veri hattı | PASS |
| 9 | En az 15 gerçek oturum | Veri toplama modu, katılımcı yönergesi, birleştirici ve rapor hazır | `docs/KATILIMCI.md`, `data/gercek/` | `VERI_RAPORU.md`: **0/15** | REQUIRES HUMAN ACTION |
| 10 | Deterministik sentetik üretici (tohum, belgeli kurallar) | Tohum 20261104; kurallar dosya başında | `data/generate_synthetic.py` | `cmp` ile aynı dosya; `test_generator.py` | PASS |
| 11 | `train.py`: doğrulama, sızıntısız bölme, metrikler, kapı, ONNX, parite, config, kart; kapı geçmezse sıfır olmayan çıkış | Oturum gruplu bölme; kapı geçmezse hiçbir dosya yazılmaz | `train.py` | `test_train_gates.py`, `test_train_robustness.py`; temiz klonda çıkış 1 | PASS |
| 12 | Tekrarlanabilir eğitim | Sabit tohum; ONNX graf adı sabitlendi | `train.py` | İki çalıştırmada 5 yapıt bayt bayt aynı | PASS |
| 13 | Kabul kapıları (BA ≥ 0.70, F1 ≥ 0.65, recall ≥ 0.70) | Kapılar uygulandı; değiştirilmedi | `egitim_ayarlari.json` | BA 0.527, F1 0.245, recall 0.171 | FAIL (geçerli mühendislik sonucu; `MODEL_ROOT_CAUSE_ANALYSIS.md`) |
| 14 | `model/model.onnx`, `config.json`, `README.md`, `metrics.json`, `model_version.json` | Kapı geçmediği için yalnızca `model/gelistirme/` altında **reddedildi** statüsüyle | `model/gelistirme/` | Şema doğrulaması, özet testi | BLOCKED (kapıya bağlı, bilinçli) |
| 15 | `config.json` çıkarım sözleşmesi + JSON Schema | Özellik sırası, birimler, aralıklar, eşik, özet, kaynak, dağıtım | `model/config.schema.json` | `test_release_guard.py` | PASS |
| 16 | Model kartı | Amaç, veri, metrikler, kapılar, sınırlamalar, etik | `model/gelistirme/README.md`, `model/README.md` | — | PASS |
| 17 | Hugging Face v2.0, commit'e sabitli URL | Yayın betiği: yalnızca kabul edilmiş model; commit SHA, etiket, indirme sonrası SHA-256 | `scripts/publish_hf.py` | Red yolları test edildi | BLOCKED (kabul edilmiş model yok; HF erişimi yok) |
| 18 | `RELEASE.md`: sürüm, metrikler, ödünleşim matrisi, gölge/canary/kademeli, geri dönüş | Hepsi; canary kovaları yerel simülasyonla | `RELEASE.md`, `app/src/ml/rollout.ts` | `rollout-sim.ts` (%5/25/50/100) | PASS |
| 19 | Tarayıcı çıkarımı, gerçek model, hata durumunda güvenli geri dönüş | Özet doğrulama, sözleşme denetimi, aralık denetimi, v1'e düşme | `modelRuntime.ts` | KÖ8, `?model=off`, aralık dışı girdi testleri | PASS |
| 20 | Python Oracle (`tests/parite.py`, `parite.json`, 5 referans) | Beklenenler gerçek ONNX'ten üretilir | `tests/parite.py`, `tests/parite.json` | GEÇTİ, fark 0 | PASS |
| 21 | Diferansiyel parite < 1e-4 | 5 referans + 34 sınır/uç değer girdisi | `parite.cy.js`, `tools/browser-e2e/specs.mjs` | Gerçek tarayıcı: 5/5 fark 0, sınır kümesi < 1e-4; Node ORT-web en büyük fark 1.79e-7 | PASS |
| 22 | Cypress testleri | v1 dosyaları korundu; v2.0 için 6 yeni dosya (ux.cy.js dahil) | `app/cypress/e2e/` | Cypress ikilisi indirilemedi; aynı senaryoların puppeteer portları 41/41 (dev) ve 41/41 (üretim), UX testleri dahil. Cypress CI'da koşacak | BLOCKED (yerel) · REQUIRES HUMAN ACTION (push/CI) |
| 23 | 60–90 sn demo: A ve B oyuncuları, farklı deneyim | Gerçek uygulama, gerçek çıkarım; red statüsü ve geçersiz kılma videoda belirtilir | `docs/demo/kara-kutu-v2.0-demo.mp4`, `docs/DEMO.md` | 77 sn, p_A = 0.730, p_B = 0.293; UX düzeltmelerinden sonra yeniden kaydedildi | PASS |
| 24 | `SINAV_TASARIMI.md` en fazla bir sayfa | Özgün senaryo, soru, cevaplar, çeldiriciler, puanlama | `SINAV_TASARIMI.md` | 343 kelime; A4, 10.5 pt'de 1 sayfa (ölçüldü) | PASS |
| 25 | README bölümleri, en fazla 3 kurulum komutu | Kurulum 3 komut; komutlar temiz klonda doğrulandı | `README.md` | `kanit/temiz-ortam.txt` | PASS |
| 26 | Kodlama aracı beyanı (3–5 madde) | 5 madde; ayrıca araç incelemeleri ile sahibin kişisel incelemesi ayrı | `README.md` | — | PASS · simüle UX değerlendirmesi dolu (`docs/UX_DEGERLENDIRME.md`); insan değerlendirmesi: REQUIRES HUMAN ACTION |
| 27 | Bonus: kendi sunucunuzda tüketici, aynı referanslarda < 1e-4 | FastAPI + onnxruntime, `rails-api` ile aynı API biçimi | `server/app.py`, `render.yaml`, `tests/integration/test_server_parity.py` | Gerçek HTTP: 5 referansta en büyük fark 3.0e-8, 34 sınır girdisinde 1.8e-7 | PASS (yerel) · Render dağıtımı: REQUIRES HUMAN ACTION |

Puanlama kalemi bazında özet ve riskler: [`ODEV_UYUM.md`](ODEV_UYUM.md).
