# Son rapor — KARA KUTU v2.0

Tarih: 2026-11-05 · Başlangıç durumu: [`FINAL_AUDIT.md`](FINAL_AUDIT.md) · Ham kanıtlar: [`docs/kanit/`](kanit/)

**Özet:** v2.0 altyapısı uygulandı ve gerçek tarayıcıda doğrulandı. Model kabul kapılarını **geçmedi**; reddedildi statüsünde kalır ve yayınlanmadı. Bunu değiştirebilecek tek şey en az 15 gerçek oturumdan oluşan veri. Sürüm adayı statüsü: **mekanizma doğrulandı, model reddedildi.**

## Durum tablosu

| Gereksinim | Durum | Kanıt |
|---|---|---|
| Repo bütünlüğü | PASS | Git geçmişi korundu (`eb42075` → … → son commit); patch zaten uygulanmış hâl, tekrar uygulanmadı; gizli anahtar taraması temiz; önbellek/yapıt dosyası izlenmiyor |
| Mevcut Primer (v1) | PASS | Gerçek Chromium'da 19/19: 8 yol, 5 kabul örneği, kişiselleştirme, saat. KÖ2 gerçek 60 sn bekledi (`kanit/tarayici-dev-v1.json`) |
| pytest | PASS | 43/43 (`kanit/python-ve-derleme.txt`) |
| TypeScript | PASS | `tsc --noEmit` temiz |
| Vite build | PASS | `vite build` temiz; `sync-model` reddedilmiş modeli (`gelistirme/`) kopyaladı |
| Cypress | BLOCKED | `download.cypress.io` erişilemez; `.cy.js` dosyaları koşturulamadı. Aynı senaryoların puppeteer portları gerçek Chromium'da 34/34 geçti. Cypress CI'da (`test.yml` → `cypress`) koşacak |
| Tarayıcı çıkarımı | PASS | Headless Chromium 153, onnxruntime-web 1.30.0 WASM. Dev sunucusu 34/34, üretim derlemesi 12/12 (`kanit/tarayici-uretim.json`), GitHub Pages alt yolu `/Kara_Kutu/`'da model yüklendi ve p = 0.7303 üretti |
| Python Oracle | PASS | `tests/parite.py` 5 referans, fark 0 |
| Diferansiyel parite | PASS | Python ↔ gerçek tarayıcı: 5/5, en büyük fark **0** (tolerans 1e-4), hem dev hem üretim derlemesinde. Aşağıdaki tablo |
| Veri toplama modu | PASS | Onay, gölge mod, CSV dışa aktarma; 3 test katılımcısının tarayıcıdan indirilen CSV'leri doğrulayıcıdan geçti ve `kaynak=test` oldukları için birleştirici tarafından reddedildi (`veriHatti`) |
| Gerçek oturumlar | BLOCKED | **0/15.** Gerçek katılımcı gerekiyor; uydurulmadı. Yönerge: `docs/KATILIMCI.md` |
| Sentetik üretici | PASS | Aynı tohum → aynı dosya (`cmp`); veri sürümü `7dae87520a30` değişmedi |
| Eğitim tekrarlanabilirliği | PASS | İki çalıştırmada 5 yapıt bayt bayt aynı ve önceki teslimle aynı (`onnx sha256 b91ba53e…`) |
| Model kabulü | FAIL | Dengeli doğruluk 0.527 < 0.70, F1 0.245 < 0.65, recall 0.171 < 0.70, gerçek veri 0/15. Bu geçerli bir mühendislik sonucudur; kapılar değiştirilmedi. Kök neden: `MODEL_ROOT_CAUSE_ANALYSIS.md` |
| ONNX yapıtı | PASS | `model/gelistirme/model.onnx` (912 bayt), sklearn ↔ ONNX farkı 2.6e-7, tarayıcı SHA-256 doğrulaması geçti. Statü: reddedildi, yalnızca gölge |
| Hugging Face yayını | BLOCKED | Kabul edilmiş model yok (yayın betiği reddediyor, çıkış 1) ve `huggingface.co` erişilemez. `v2.0` etiketi bilerek oluşturulmadı |
| Demo videosu | PASS | `docs/demo/kara-kutu-v2.0-demo.mp4`: 76 sn, 390×844, H.264, gerçek uygulama ve çıkarım. Geliştirici geçersiz kılması ve red statüsü videoda açıkça belirtildi |
| README | PASS | Durum, kurulum (3 komut), testler, beyan güncellendi. İnsan incelemesi alanı repo sahibine bırakıldı (uydurulmadı) |
| Son regresyon | PASS | Bu tablodaki tüm komutlar son kod üzerinde yeniden koşturuldu |

## Diferansiyel parite (gerçek tarayıcı, üretim derlemesi)

| Referans | Python (onnxruntime 1.20.1) | Tarayıcı (onnxruntime-web 1.30.0) | |fark| |
|---|---|---|---|
| akici_ilk_karar | 0.2929303348 | 0.2929303348 | 0 |
| zorlanan_ilk_karar | 0.7303456068 | 0.7303456068 | 0 |
| ikinci_oyunda_toparlanan | 0.3948200047 | 0.3948200047 | 0 |
| deneyimli_zaman_asimi | 0.6738961935 | 0.6738961935 | 0 |
| uc_deger | 0.9999377131 | 0.9999377131 | 0 |

KÖ6 ve KÖ7 testlerinde olasılık doğrudan girdi verilerek değil, **oyunun kendi akışıyla** üretildi. Tarayıcı, oyuncunun tıklamalarından 11 özelliği kendisi hesapladı ve aynı değerlere ulaştı.

## Çalıştırılan komutlar

```bash
python -m pytest -q tests                                        # 43 passed
python data/validate_dataset.py data/oturumlar.csv               # GEÇERLİ, 0 gerçek / 400 sentetik
python data/generate_synthetic.py --cikti /tmp/s.csv && cmp /tmp/s.csv data/sentetik.csv
python tests/parite.py --model model/gelistirme/model.onnx       # GEÇTİ, fark 0
python scripts/publish_hf.py --repo x/y --kuru                   # YAYIN REDDEDİLDİ, çıkış 1
python train.py                                                  # çıkış 1, model/ köküne yazılmadı
python train.py --gelistirme  (×2)                               # yapıtlar bayt bayt aynı
cd app && npx tsc --noEmit && npm run build
cd tools/browser-e2e && ./with-server.sh node run.mjs yollar kabul                       # 19/19
./with-server.sh node run.mjs adaptif model parite veri veriHatti                        # 15/15
PROD=1 ./with-server.sh node run.mjs parite adaptif model                                # 12/12
./with-server.sh node demo.mjs                                                           # 76 sn mp4
python analysis/kok_neden.py                                                             # teşhis
```

## Bu aşamada düzeltilen hatalar

| # | Hata | Etki |
|---|---|---|
| 1 | Debug paneli 390 px ekranda oyun kontrollerini örtüyordu | v2.0 Cypress testleri CI'da da kırılırdı |
| 2 | Eksik model için SPA sunucusu 200 + HTML döndürüyor, hata mesajı yanıltıcıydı | Model yine reddediliyordu; mesaj düzeltildi |
| 3 | Test oturumları `kaynak=gercek` yazıyordu | Gerçek veriye karışma riski; artık `kaynak=test`, birleştirici ve eğitim reddeder |
| 4 | Test koşucusu kapatılmış sayfada çöküyordu | Yalnızca test altyapısı |
| 5 | Demo kaydında gerçek zamanlı VP9 kodlaması çok yavaştı | CDP kare yakalama + sonradan H.264 |
| 6 | `with-server.sh` sunucuyu kapatamıyor ve sonsuza dek bekliyordu; ikinci koşu eski sunucuya bağlanmıştı | Düzeltildi: doğru süreç grubu, port doluysa başlamayı reddetme. Etkilenen koşular temiz olarak tekrarlandı |

## Değişen dosyalar (bu aşama)

- **Uygulama:** `app/src/components/DebugPanel.tsx`, `app/src/ml/modelRuntime.ts`, `app/src/ml/telemetry.ts`, `app/src/App.tsx`
- **Veri ve eğitim:** `data/birlestir.py`, `data/schema.py`, `data/validate_dataset.py`, `train.py`
- **Testler:** `tests/integration/test_train_robustness.py`, `tests/unit/test_birlestir.py`
- **Tarayıcı testleri ve demo:** `tools/browser-e2e/` (lib, specs, run, with-server, demo)
- **Analiz:** `analysis/kok_neden.py` ve `kok_neden_sonuclari.json`
- **Belgeler:** `docs/FINAL_AUDIT.md`, `FINAL_REPORT.md`, `MODEL_ROOT_CAUSE_ANALYSIS.md`, `DEMO.md`, `KATILIMCI.md`, `docs/demo/`, `docs/kanit/`
- **Proje belgeleri ve CI:** `README.md`, `RELEASE.md`, `spec.md` (§15 `kaynak=test`), `data/SOZLUK.md`, `data/README.md`, `data/VERI_RAPORU.md`, `app/README-cypress.md`, `.github/workflows/test.yml`

## Başlatma

```bash
pip install -r requirements.txt
cd app && npm install
npm run dev        # http://localhost:3000   ·  ?debug=1 geliştirici paneli  ·  ?veri=1 veri toplama
```

## Kalan dış eylemler (yerel olarak yapılamaz)

1. **15+ gerçek oturum toplamak** (`docs/KATILIMCI.md`). Ardından `python data/birlestir.py && python train.py`.
2. **CI'nın ilk koşusunu gözden geçirmek.** Cypress dosyaları ilk kez orada koşacak. Push bu ortamdan yapılmadı.
3. **Model kabul edilirse yayın:** `HF_TOKEN` ile `scripts/publish_hf.py`; ardından `v2.0` etiketi.
4. **README'deki insan incelemesi alanını doldurmak.**
5. **v2.1 kararı:** Hedef değişikliği gerekiyorsa, gerçek veriyi değerlendirmeden önce ön kayıt yapılmalı (`MODEL_ROOT_CAUSE_ANALYSIS.md` §6).

## Dürüst sınırlamalar

- Tarayıcı testleri Cypress değil, aynı senaryoların puppeteer portları. Tek bir tarayıcı motoru (Chromium 153) kullanıldı; Firefox ve Safari denenmedi. Gerçek bir telefonda dokunmatik kullanım denenmedi.
- Google Fonts sandbox'ta yüklenemedi; testler ve video yedek yazı tipleriyle koştu.
- Vite derlemesi ORT WASM dosyasını hem `assets/` hem `ort/` altına koyuyor (~14 MB yinelenen dağıtım boyutu). Tarayıcı yalnızca `ort/` kopyasını indiriyor, bu ağ isteklerinde doğrulandı.
- Tüm model metrikleri sentetik üreticinin varsayımlarını yansıtır; gerçek dünya başarısı hakkında bir şey söylemez.
