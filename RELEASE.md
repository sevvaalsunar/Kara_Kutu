# RELEASE — KARA KUTU

## v2.0 · Adaptif Primer — durum: YAYINLANMADI

| | |
|---|---|
| Sürüm | `2.0.0` (etiket `v2.0`) |
| Önceki sürüm | v1.x: modelsiz, girişteki 3 soruya dayalı kural tabanlı uyarlama |
| Model statüsü | **reddedildi**: metrik kabul kapıları geçmedi (aşağıda) |
| Model yapıtı | `model/gelistirme/model.onnx`, SHA-256 `b91ba53e820ef6b5a5bdbce17746b13fde3d44051b4a8dbfbadc781738411640`, 912 bayt |
| Veri seti sürümü | `7dae87520a30`: 400 sentetik oturum, 2010 satır, 1610 etiketli; **0 gerçek oturum** |
| Hugging Face | Yayın yapılmadı. Repo: `<!-- HF_REPO -->` · Commit: `<!-- HF_COMMIT -->` |
| Sabitli URL | `<!-- HF_PINNED_URL -->` (biçim: `https://huggingface.co/<kullanici>/<repo>/resolve/<commit>/model.onnx`) |

### v2.0 değişiklikleri

- Oyuncunun bir sonraki kararında riskli seçimi seçme olasılığını tahmin eden lojistik regresyon modeli (spec.md §11–§14).
- Tarayıcıda `onnxruntime-web` 1.30.0 (WASM) ile çıkarım; olasılık ≥ 0.65 ise kavram özeti, sonraki kararda ek tutor desteği ve 90 sn sayaç.
- Anonim veri toplama modu (`?veri=1`), CSV dışa aktarma, doğrulayıcı, birleştirici.
- Deterministik sentetik üretici, kapılı eğitim hattı, Python Oracle, diferansiyel parite testleri, debug paneli.
- 8 yol, 2 son ve v1'in tüm `data-testid` sözleşmesi değişmedi.

### Doğrulama durumu (son aşama)

| | |
|---|---|
| Gerçek tarayıcıda çıkarım | Doğrulandı: headless Chromium 153, dev sunucusu, üretim derlemesi ve GitHub Pages alt yolu (`/Kara_Kutu/`) |
| Python ↔ tarayıcı paritesi | 5/5 referansta fark 0 (tolerans 1e-4) |
| v1 regresyonu (gerçek tarayıcı) | 19/19 |
| Cypress dosyalarının kendisi | Koşturulmadı (ikili indirilemedi); CI'da koşacak |
| Demo videosu | Kaydedildi: `docs/demo/kara-kutu-v2.0-demo.mp4` (77 sn; UX düzeltmelerinden sonra yeniden kaydedildi). Uyarlama geliştirici geçersiz kılmasıyla gösterilir; videoda ve oyunun üstündeki DENEYSEL MOD şeridinde belirtilir. |
| Kök neden analizi | `docs/MODEL_ROOT_CAUSE_ANALYSIS.md` |
| Ayrıntılı kanıtlar | `docs/FINAL_REPORT.md` |

### Model ve eğitim yapılandırması

`StandardScaler` + `LogisticRegression(C=1.0, class_weight="balanced")`. 11 float32 özellik (sıra `model/gelistirme/config.json`). Tohum 20261104. Oturum gruplu, katmanlı 5 kat (ilk kat test: 308 satır / 76 oturum). ONNX opset 17, ai.onnx.ml 3. Tüm ayarlar eğitimden önce `model/egitim_ayarlari.json` dosyasına yazıldı ve `6ffaaeb` commit'inde spec ile birlikte sabitlendi.

### Metrikler (test kümesi, eşik 0.65)

| Metrik | Değer | Kapı | Sonuç |
|---|---|---|---|
| Dengeli doğruluk | 0.527 | ≥ 0.70 | GEÇMEDİ |
| F1 | 0.245 | ≥ 0.65 | GEÇMEDİ |
| Recall (destek) | 0.171 | ≥ 0.70 | GEÇMEDİ |
| Precision | 0.429 | — | — |
| ROC-AUC | 0.651 | — | — |
| Karışıklık matrisi | TN 179 · FP 24 · FN 87 · TP 18 | — | — |
| Çapraz doğrulama dengeli doğruluk | 0.543 ± 0.032 | — | — |
| Tek özellik AUC (en yüksek) | 0.605 | ≤ 0.98 | GEÇTİ |
| ONNX paritesi (2308 girdi) | 2.6e-7 | < 1e-4 | GEÇTİ |
| Gerçek oturum | 0 | ≥ 15 | GEÇMEDİ |

**Kök neden analizi** ayrıntıları `docs/MODEL_ROOT_CAUSE_ANALYSIS.md`'dedir. Özet: veri miktarı (400 → 6400 oturumda AUC 0.669 → 0.671) ve model sınıfı (gradient boosting 0.682) neden değildir; ana neden hedefin tek bir gürültülü olay olmasıdır.

**Tavan analizi** (`data/tavan_analizi.py`, `data/tavan_analizi.json`): Üreticinin gizli zorlanma değişkenini kusursuz bilen Bayes-optimal tahminci bile eşik 0.65'te dengeli doğruluk 0.586, F1 0.330, recall 0.210'a ulaşıyor; en iyi eşikte (0.37) bile 0.676. Bu etiket tanımı ve üretici varsayımlarıyla kapılar erişilemez. Modelin ROC-AUC'si 0.651, tavan 0.736.

Eşik ve kapılar sonuçlara bakılarak değiştirilmedi. Sonraki adım için iki dürüst yol var; ikisi de yeni bir ön kayıt (spec + `egitim_ayarlari.json` commit'i) gerektirir:

1. **Gerçek veri topla** (≥ 15 oturum, `?veri=1`). Gerçek davranışın sinyali sentetik varsayımlardan güçlü veya zayıf çıkabilir; ölçülmeden bilinemez.
2. **Hedefi yeniden tanımla.** "Bir sonraki karar riskli mi" tek bir Bernoulli çekilişidir ve gürültüsü doğası gereği yüksektir. Daha az gürültülü bir hedef (örneğin "bu oyunun kalan kararlarının en az biri riskli") ürün gerekçesiyle seçilebilir. Bu seçim test metriklerine bakılarak yapılırsa kabul kapısı anlamını yitirir.

### Yayın doğrulaması (kabul edilmiş bir sürüm için)

```bash
python data/birlestir.py && python data/validate_dataset.py data/oturumlar.csv
python train.py                                   # 0 ile çıkmalı (statü: kabul)
python tests/parite.py --uret && python -m pytest tests
python scripts/publish_hf.py --repo <kullanici>/kara-kutu-destek --kuru
HF_TOKEN=... python scripts/publish_hf.py --repo <kullanici>/kara-kutu-destek
cd app && npx cypress run --spec cypress/e2e/parite.cy.js   # gerçek tarayıcı paritesi
```

`publish_hf.py` yalnızca `model/` kökündeki **kabul** statüsündeki modeli yayınlar, `v2.0` etiketini commit'e bağlar, sabitli URL'den dosyayı indirip SHA-256'yı doğrular ve bu dosyadaki yer tutucuları gerçek repo, commit ve URL ile doldurur. Üretim tüketicisi `main` dalını asla kullanmaz.

---

## Dağıtım mimarisi kararı

### Ödünleşim matrisi

| Ölçüt | Tarayıcı (`onnxruntime-web`) | Mobil (Expo / ORT React Native) | Sunucu (FastAPI + ORT) |
|---|---|---|---|
| İnternet gereksinimi | Yalnızca ilk yükleme; sonra çevrimdışı çalışır | Kurulumdan sonra yok | Her tahminde gerekli |
| Ağ gecikmesi | Yok (yerel) | Yok | Her karar için bir tur (~50–300 ms) |
| Soğuk başlangıç | WASM ~14 MB (gzip ~3.7 MB) + model 912 bayt; bir kez. Ölçülen yükleme (headless Chromium, yerel sunucu): 461 ms – 2.1 s | Uygulama kurulumu | Sunucu uyanma süresi (ücretsiz katmanda saniyeler) |
| Çıkarım süresi | < 1 ms (11 özellik, lineer model) | < 1 ms | < 1 ms + ağ |
| Veri gizliliği | Oyuncu verisi cihazdan çıkmaz | Cihazdan çıkmaz | Her karar sunucuya gider; KVKK yükümlülüğü doğar |
| Model görünürlüğü | Model herkese açık indirilebilir | Paket içinden çıkarılabilir | Gizli kalabilir |
| Tersine mühendislik riski | Yüksek, ama 11 katsayılı bir modelde gizlenecek değer yok | Orta | Düşük |
| Bakım | Statik site; sunucu yok | Ayrı kod tabanı, mağaza süreçleri | Sunucu, izleme, ölçekleme |
| Güncelleme | `config.json`'daki sabitli commit değişir, yeniden derleme | Mağaza onayı veya OTA güncelleme | Anında, sunucu tarafında |
| Çevrimdışı | Evet (yüklendikten sonra) | Evet | Hayır |
| İşletme maliyeti | ~0 (GitHub Pages) | Geliştirici hesapları | Sürekli sunucu |
| Test karmaşıklığı | Tarayıcı + Python paritesi (Cypress) | Cihaz/simülatör testleri | API sözleşme testleri |

### Karar: tarayıcı içi çıkarım

KARA KUTU zaten GitHub Pages'ta statik bir web uygulaması. Model küçük ve gizli bir değer taşımıyor; oyuncu verisinin cihazdan çıkmaması, veri toplama dışında KVKK yükümlülüğü doğurmuyor. Sunucu, yalnızca gizlilik riskini ve işletme maliyetini artırırdı. Mobil uygulama spec §2'de kapsam dışı. Bedeli: ilk yüklemede ~3.7 MB (gzip) WASM indirmesi ve modelin herkese görünür olması. Model yüklenemezse oyun v1 kurallarıyla oynanır (spec §18).

## Güvenli dağıtım

Kol kararı `app/src/ml/rollout.ts` içinde, öncelik sırasıyla:

1. `?model=off` → kapalı.
2. `?veri=1` → gölge. Veri toplama etiketleri müdahaleyle kirlenmesin diye.
3. `?rollout=on|shadow` → geliştirici geçersiz kılması. Debug panelinde işaretlenir.
4. Statü `kabul` değil → gölge.
5. `config.rollout`: `off`, `shadow`, `on` veya `canary` (FNV-1a ile oturum kimliği 0–99 kovasına eşlenir; kova < yüzde ise uyarlama).

### Plan

| Aşama | config.rollout | Süre / ölçüt |
|---|---|---|
| 1. Gölge | `shadow` | Model her kararda çalışır, `model_p` kaydedilir, oyun değişmez. ≥ 15 gerçek oturumda tahmin dağılımı ve hata oranı incelenir. |
| 2. Canary | `canary`, %5 | Oturumların %5'i uyarlama kolunda. Dağılım yerel simülasyonda doğrulandı (20 000 kimlik: %4.88). |
| 3. Kademeli | %25 → %50 → %100 | Her adımda aşağıdaki geri dönüş tetikleyicileri izlenir. |

**Gerçek trafik yok.** Kova dağılımı yalnızca yerel simülasyonla sınandı (`npm run test:rollout`); canlı bir canary yapılmadı. Sınıf demosunda uyarlama `?rollout=on` ile açılır.

### Geri dönüş tetikleyicileri

| Tetikleyici | Ölçüm | Eşik |
|---|---|---|
| Yükleme hatası | Debug paneli / konsol `Model devre dışı` | Oturumların > %2'si |
| Çıkarım hatası | `LastPrediction.error` | Herhangi bir sistematik hata |
| Gecikme | Debug paneli `ms` | p95 > 50 ms |
| Kararsız davranış | Aynı referans girdide farklı olasılık | `tests/parite.json` farkı ≥ 1e-4 |
| Aşırı uyarlama | Uyarlanan karar oranı | Gölge dönemindeki oranın 2 katından fazla |
| Kullanıcı deneyimi | Oyunu yarıda bırakma oranı (CSV'de son karar K3 değil) | Kontrol koluna göre belirgin artış |
| Yanlış uyarlama | Destek alan kararın ardından riskli seçim oranı (`previous_support_effectiveness`) | Kontrol kolundan kötü |

### Geri dönüş prosedürü

1. **Anında:** `model/config.json` (ve `app/public/model/config.json`) içinde `"rollout": {"mode": "off"}` veya `"shadow"` yapıp yeniden dağıt. Model dosyasına dokunmak gerekmez.
2. **Sürüm geri alma:** `source.pinned_url` ve `hf_commit` alanlarını önceki kabul edilmiş commit'e çevir, `artifact.sha256`'yı o dosyanın özetiyle güncelle. Uygulama özeti tutmayan dosyayı reddeder.
3. **Tam geri dönüş (v1):** `model/` klasörünü boşalt; `sync-model.mjs` model bulamazsa uygulama modelsiz derlenir ve v1 kurallarıyla çalışır.
4. Her geri dönüş, nedeni ve tarihiyle bu dosyaya eklenir.

---

## CI ve gizli anahtarlar

| İş | Gizli anahtar | Not |
|---|---|---|
| `python-ve-sozlesme` | Yok | pytest, veri doğrulama, `tsc`, `vite build` |
| `tarayici-e2e` | Yok | Sistem Chrome'u (`CHROME_PATH`); dev sunucusu ve üretim derlemesi |
| `cypress` | Yok | Üretim derlemesi (`npm run serve:prod`); video her zaman, hata ekran görüntüleri yalnızca başarısızlıkta artefakt |
| Hugging Face yayını | `HF_TOKEN` | **CI'da değil**, elle ve yalnızca kabul edilmiş model için. Repoya veya iş akışına yazılmaz; yalnızca yerel ortam değişkeni ya da GitHub Actions secret. CI hiçbir model yayınlamaz. |

Gemini tutor anahtarı (`GEMINI_API_KEY`) testlerde gerekmez: testler `?test=1` ile sabit tutor cevabı kullanır.

## Geri dönüşün test edilmesi

| Adım | Nasıl test edilir |
|---|---|
| `rollout.mode = "off"` / `"shadow"` | `npm run test:rollout` (öncelik sırası ve canary kovaları); tarayıcıda `?model=off` ve gölge mod testleri |
| Model dosyası değişirse | Uygulama, `config.json`'daki SHA-256 ile uyuşmayan dosyayı reddeder (`test_config_ozeti_dosyayla_ayni`, KÖ8) |
| Model tamamen kaldırılırsa | `model/` boşken `npm run build` modelsiz derler; oyun v1 kurallarıyla çalışır (KÖ8 aynı yolu sınar) |
| Kabul edilmemiş sürüm | `publish_hf.py` reddeder (`tests/unit/test_release_guard.py`, 10 test) |

## v1.x

Google Stitch tasarımı, AI Studio uygulaması, Cypress E2E testleri, tutor eval. Ayrıntılar `README.md` ve `eval/`.
