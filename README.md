# KARA KUTU: Otonom Yaşam Destek Krizi · v2.0 Adaptif Primer

YZM301 · SE Primer ödevi · Şevval Sunar

Saat 03:14. Yapay zekâ destekli yoğun bakım ağı ICU-Net siber saldırı altında ve 300 hastanın cihazına yanlış komutlar gidiyor. Nöbetçi mühendis sensin. Oyuncu üç mühendislik kararı verir (mimari, veri ve test, güvenlik ve KVKK). Her karardan sonra uygulama kararın teknik sonucunu ve nedenini gösterir. Takılan oyuncuya bir AI tutor cevabı söylemeden, soru sorarak yol gösterir.

**v2.0** buna davranışa duyarlı bir katman ekler. Oyuncunun karar süresi, tereddüdü, ipucu kullanımı ve önceki seçimleri küçük bir tablo modeline verilir. Model, oyuncunun bir sonraki kararda zorlanma olasılığını tahmin eder. Olasılık eşiği geçerse oyun kavram özeti ekler, tutor'u kendiliğinden açar ve süre baskısını azaltır.

> **Durum (dürüst özet):** v2.0 altyapısı çalışıyor ve gerçek tarayıcıda doğrulandı. Ancak eğitilen model **kabul kapılarını geçmedi** (dengeli doğruluk 0.527 < 0.70) ve yalnızca sentetik veriyle eğitildi; 0/15 gerçek oturum toplandı. Model bu yüzden yayınlanmadı ve uygulamada varsayılan olarak yalnızca **gölge modda** çalışır.
>
> Ayrıntılar: [`docs/FINAL_REPORT.md`](docs/FINAL_REPORT.md) · [`docs/MODEL_ROOT_CAUSE_ANALYSIS.md`](docs/MODEL_ROOT_CAUSE_ANALYSIS.md) · [`RELEASE.md`](RELEASE.md)

## Linkler

- **Canlı uygulama (GitHub Pages):** [KARA KUTU](https://sevvaalsunar.github.io/Kara_Kutu/) · veri toplama: `?veri=1` · geliştirici paneli: `?debug=1`
- **AI Studio sürümü:** [KARA KUTU — AI Studio](https://ai.studio/apps/0d3c42eb-7942-4398-a0f7-80546707e3c9)
- **v1 demo videosu (60 sn):** [app/cypress/videos/00-demo.cy.js.mp4](app/cypress/videos/00-demo.cy.js.mp4)
- **v2.0 demo videosu (76 sn):** [docs/demo/kara-kutu-v2.0-demo.mp4](docs/demo/kara-kutu-v2.0-demo.mp4). Uyarlama, geliştirici geçersiz kılmasıyla gösterilir; videoda açıkça belirtilir ([`docs/DEMO.md`](docs/DEMO.md)).
- **Katılımcı yönergesi:** [`docs/KATILIMCI.md`](docs/KATILIMCI.md)
- **Hugging Face:** henüz yayınlanmadı (bkz. RELEASE.md)

## Kurulum ve çalıştırma

```bash
pip install -r requirements.txt
cd app && npm install
npm run dev            # http://localhost:3000 (model dosyalarını public/ altına kendisi kopyalar)
```

Tutor için `app/.env` dosyasına Gemini API anahtarı eklenir (`app/README.md`). Anahtar yoksa tutor yerel ipuçlarıyla çalışır. Model yüklenemezse oyun v1 kurallarıyla oynanır.

## Mimari

```
Oyuncu ─► React oyun (App.tsx durum makinesi)
            │ her kararda DecisionEvent
            ▼
          features.ts ──(11 özellik, spec §13)──► onnxruntime-web (WASM) ──► p
            │                                                               │
            ▼                                                               ▼
          SessionLog (bellekte, CSV dışa aktarma)          rollout.ts: off | shadow | on | canary
                                                                            │ p ≥ 0.65 ve kol "on"
                                                                            ▼
                                                 Kavram özeti · Ek tutor desteği · 90 sn sayaç

Python tarafı: data/ (şema, doğrulama, sentetik üretim) ─► train.py (kapılı eğitim, ONNX, parite)
              ─► model/ ─► tests/parite.py (Oracle) ◄─parite─► tarayıcı / ORT-web
```

## Repo yapısı

| Yol | İçerik |
|---|---|
| `spec.md` | v1 şartnamesi + v2.0 §11–§20 (model hedefi, özellikler, etiket, kapılar, gizlilik, KÖ6–KÖ9). Eğitimden önce yazıldı (`6ffaaeb`). |
| `docs/DENETIM.md` | v2.0 öncesi repo denetimi |
| `data/` | `oturumlar.csv`, `SOZLUK.md`, `README.md`, şema, doğrulayıcı, sentetik üretici, birleştirici, tavan analizi |
| `train.py` | Tekrarlanabilir, kapılı eğitim hattı |
| `model/` | Ön kayıtlı ayarlar, sözleşme şeması; `gelistirme/`: reddedilmiş model ve model kartı |
| `tests/` | `parite.py` (Python Oracle), `parite.json`, `unit/`, `integration/` |
| `app/src/ml/` | Tarayıcı: özellikler, model çalışma zamanı, dağıtım kolu, oturum kaydı, uyarlama metinleri |
| `app/cypress/` | v1 regresyon testleri (değişmedi) + v2.0 testleri |
| `tools/browser-e2e/` | Cypress senaryolarının gerçek Chromium (puppeteer) portları, veri hattı uçtan uca testi, demo kaydı |
| `analysis/` | Kök neden teşhis analizi (kapıları değiştirmez) |
| `docs/` | Denetim, son rapor, kök neden analizi, demo, katılımcı yönergesi |
| `scripts/publish_hf.py` | Commit'e sabitli Hugging Face yayını |
| `RELEASE.md` | Sürüm notları, metrikler, dağıtım ödünleşim matrisi, güvenli dağıtım, geri dönüş |
| `SINAV_TASARIMI.md` | Vize için özgün kapalı kitap sorusu |
| `design/`, `DESIGN.md`, `eval/` | v1: Stitch tasarımı ve tutor değerlendirmesi |

## Veri, eğitim ve değerlendirme

```bash
python data/generate_synthetic.py          # 400 sentetik oturum, tohum 20261104
python data/birlestir.py                   # sentetik + data/gercek/*.csv → oturumlar.csv
python train.py                            # kapılar geçmezse sıfır olmayan kodla durur, dosya yazmaz
python train.py --gelistirme               # reddedilen modeli yalnızca model/gelistirme/ altına yazar
```

**Hedef:** `needs_learning_support`, yani oyuncunun aynı oturumdaki bir sonraki kararı riskli mi (spec §12). Model zekâ, kişilik ya da yetkinlik ölçmez.

**Kabul kapıları** eğitimden önce `model/egitim_ayarlari.json` dosyasında sabitlendi: eşik 0.65'te dengeli doğruluk ≥ 0.70, F1 ≥ 0.65, recall ≥ 0.70, sızıntı yok, ONNX paritesi < 1e-4, ≥ 15 gerçek oturum. Oturum gruplu bölme kullanılır: aynı oturumun kararları hem eğitimde hem testte olamaz. Model yapıtları bayt bayt tekrarlanabilir.

**Gerçek veri toplama:** `?veri=1` modunda oyuncu gizlilik notunu onaylar ve son ekranda CSV'yi kendisi indirir. Veri sunucuya gitmez. Adımlar: [`data/README.md`](data/README.md).

## Çıkarım ve dağıtım

Model tarayıcıda çalışır. Gerekçe ve sunucu/mobil seçenekleriyle karşılaştırma RELEASE.md'dedir. Uygulama:

- `config.json` sözleşmesini (özellik sırası, tensör adları, eşik) denetler.
- Model dosyasının SHA-256 özetini doğrular.
- Aralık dışı özellikle çıkarım yapmaz.

Model, Hugging Face'te yayınlandıktan sonra yalnızca commit'e sabitli URL'den indirilir. O zamana kadar yerel kopya kullanılır.

Dağıtım kolları: `?model=off`, gölge, canary (oturum kovası), açık. Kabul edilmemiş model yalnızca gölgede çalışır; `?rollout=on` bir geliştirici geçersiz kılmasıdır ve panelde DENEYSEL olarak görünür.

## Testler

```bash
python -m pytest -q tests                  # 55 test: birim, kapılar, eğitim sağlamlığı, birleştirici, TS↔Python sözleşmesi, ORT-web paritesi, dağıtım simülasyonu
cd app && npm run lint && npm run build
cd tools/browser-e2e && npm install && ./with-server.sh node run.mjs              # gerçek Chromium: 35 test (dev sunucusu)
PROD=1 ./with-server.sh node run.mjs parite adaptif model                        # üretim derlemesi (dist/)
cd app && npx cypress run                  # Cypress (uygulama çalışırken; app/README-cypress.md)
```

Son doğrulama sonuçları ve kanıtlar: [`docs/FINAL_REPORT.md`](docs/FINAL_REPORT.md).

## Ürün kararı: yapmadığım 3 özellik (v1)

1. **Kararı geri alma:** Kriz anında verilen kararların geri alınamaması oyunun öğretmek istediği şeyin kendisi; geri alma butonu bu dersi boşaltırdı, yolları denemek için "Baştan oyna" var.
2. **Gerçek zamanlı akan oyun saati:** Saat gerçek zamanla aksaydı oyuncu metni okurken cezalandırılırdı ve hikâyedeki zaman çizelgesi tutmazdı; süre baskısını yalnızca isteyen oyuncuya, "Deneyimliyim" modundaki 60 saniyelik sayaçla verdim.
3. **Hesap ve ilerleme kaydı:** Beş dakikalık tek oturumluk bir oyunda kayıt yalnızca sürtünme eklerdi ve kişisel veri saklamak KVKK yükümlülüğü getirirdi.

## Gizlilik

Toplanan tek veri oyun içi sayısal olaylardır: süre, tereddüt sayısı, seçim, ipucu kullanımı. Ad, e-posta, cihaz kimliği, IP, konum ve tutor mesajlarının metni toplanmaz. Çıkarım cihazda yapılır. Veri toplama modunda veri yalnızca sekme belleğinde tutulur ve yalnızca oyuncunun kendi indirdiği CSV ile paylaşılır.

## Bilinen sınırlamalar

- Model kabul kapılarını geçmedi. Tavan analizine göre bu etiket tanımı ve sentetik varsayımlarla kapılar erişilemez.
- Gerçek veri yok; tüm metrikler sentetik üreticinin varsayımlarını yansıtır.
- Tereddüt fareyle ölçülür; dokunmatik ekranda düşük kalır.
- Başka sekmede beklemek karar süresini şişirir.
- Cypress ikilisi geliştirme ortamında indirilemediği için `app/cypress/*.cy.js` dosyalarının kendisi koşturulmadı. Aynı senaryoların puppeteer portları gerçek Chromium'da geçti. Cypress dosyaları ilk kez CI'da (`.github/workflows/test.yml`) koşacak.
- `onnxruntime-web` WASM dosyası ilk yüklemede ~3.7 MB (gzip) indirilir.

## Araçlar

Google Stitch (tasarım) → Google AI Studio (v1 uygulaması) → Cypress (E2E) → scikit-learn, skl2onnx, onnxruntime / onnxruntime-web (v2.0). v1 uygulama kodu AI Studio tarafından üretildi; v1 spec, tasarım kararları, eval ve ürün kararı bana ait.

## Kodlama aracı beyanı (v2.0)

- **Araç:** v2.0'ın kodu, testleri, analizleri ve belgeleri Claude (Anthropic) ile, claude.ai sohbet arayüzündeki kod çalıştırma ortamında yazıldı ve hata ayıklandı.
- **Aracın verdiği mühendislik kararları:**
  - Etiket tanımı, 11 özellik, 0.65 eşiği ve kabul kapıları; eğitimden önce sabitlendi (`6ffaaeb`).
  - Tarayıcı içi çıkarım.
  - Kabul edilmemiş modelin yalnızca gölgede çalışması; kapı geçmeyince eşiğin, hedefin ve üreticinin değiştirilmemesi.
- **Gerçekten çalıştırılan doğrulamalar:** pytest, `tsc`, `vite build`, gerçek headless Chromium'da Cypress senaryolarının puppeteer portları (dev ve üretim derlemesi), Python ↔ tarayıcı paritesi ve demo kaydı. Sayılar ve kanıtlar: `docs/FINAL_REPORT.md`, `docs/kanit/`.
- **Çalıştırılamayanlar:** Cypress dosyalarının kendisi (ikili indirilemedi; CI'da koşacak), Hugging Face yayını (kabul edilmiş model yok) ve gerçek kullanıcı oturumları (0/15).
- **Doğrulama sırasında bulunan hatalar:** 7 hata bulundu ve düzeltildi; liste `docs/FINAL_AUDIT.md` ve `docs/FINAL_REPORT.md`'de.

## İnceleme kaydı

### Araç tarafından yapılan teknik incelemeler (yapıldı)

- [x] Spec §11–§20 ile `data/schema.py`, `app/src/ml/features.ts` ve `train.py` arasındaki tutarlılık. Formül eşitliği 60 oturumluk TS↔Python sözleşme testiyle doğrulandı.
- [x] Etiket sızıntısı: gruplu bölme ve tek özellik AUC'si ≤ 0.98; özellikler yalnızca geçmişten hesaplanıyor.
- [x] Kabul kapısı ve yayın koruması: başarısız eğitimin, aday ve reddedilmiş modelin ve özet uyuşmazlığının yayını engellediği testlerle gösterildi.
- [x] Gizlilik: CSV'de kişisel veri sütunu yok; doğrulayıcı böyle sütunları reddediyor; veri sunucuya gitmiyor.
- [x] Tutor kuralı (§7): uyarlama destek metinleri seçenek adı veya harfi içermiyor (otomatik test).
- [x] Gizli anahtar taraması: repoda token veya API anahtarı yok.
- [x] Mobil düzen: 390 px ekranda oyun kontrollerinin örtülmediği gerçek tarayıcıda doğrulandı (hata #1 düzeltildi).

### Repo sahibinin kişisel incelemesi (yalnızca Şevval Sunar doldurabilir)

Bu maddeler bilerek boş bırakıldı; araç kimin neyi incelediğini bilemez ve bunu uydurmaz.

- [ ] Okuyup onayladığım dosyalar/bölümler: …
- [ ] Elle değiştirdiğim veya geri aldığım yerler: …
- [ ] Kendi telefonumda `?veri=1` ile oynayıp kontrol ettiğim akışlar: …
- [ ] Demo videosunu izledim ve dürüstlük notlarının yeterli olduğunu onaylıyorum: …
- [ ] CI'ın ilk koşu sonucu (Cypress dahil): …
