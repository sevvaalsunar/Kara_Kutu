# KARA KUTU: Otonom Yaşam Destek Krizi · v2.0 Adaptif Primer

YZM301 · SE Primer ödevi · Şevval Sunar

Saat 03:14. Yapay zekâ destekli yoğun bakım ağı ICU-Net siber saldırı altında ve 300 hastanın cihazına yanlış komutlar gidiyor. Nöbetçi mühendis sensin. Oyuncu üç mühendislik kararı verir (mimari, veri ve test, güvenlik ve KVKK). Her karardan sonra uygulama kararın teknik sonucunu ve nedenini gösterir. Takılan oyuncuya bir AI tutor cevabı söylemeden, soru sorarak yol gösterir.

**v2.0** buna davranışa duyarlı bir katman ekler. Oyuncunun karar süresi, tereddüdü, ipucu kullanımı ve önceki seçimleri küçük bir tablo modeline verilir. Model, oyuncunun bir sonraki kararda zorlanma olasılığını tahmin eder. Olasılık eşiği geçerse oyun kavram özeti ekler, tutor'u kendiliğinden açar ve süre baskısını azaltır.

> **Durum (dürüst özet):** v2.0 altyapısı çalışıyor ve test edildi, ancak eğitilen model **kabul kapılarını geçmedi** (dengeli doğruluk 0.527 < 0.70) ve yalnızca sentetik veriyle eğitildi; 0/15 gerçek oturum toplandı. Model bu yüzden yayınlanmadı ve uygulamada varsayılan olarak yalnızca **gölge modda** çalışır. Ayrıntılar ve tavan analizi: [`RELEASE.md`](RELEASE.md).

## Linkler

- **Canlı uygulama (GitHub Pages):** [KARA KUTU](https://sevvaalsunar.github.io/Kara_Kutu/) · veri toplama: `?veri=1` · geliştirici paneli: `?debug=1`
- **AI Studio sürümü:** [KARA KUTU — AI Studio](https://ai.studio/apps/0d3c42eb-7942-4398-a0f7-80546707e3c9)
- **v1 demo videosu (60 sn):** [app/cypress/videos/00-demo.cy.js.mp4](app/cypress/videos/00-demo.cy.js.mp4)
- **v2.0 demo:** henüz kaydedilmedi; betik [`docs/DEMO.md`](docs/DEMO.md)
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
python -m pytest -q tests                  # 31 test: birim, kapılar, TS↔Python sözleşmesi, ORT-web paritesi, dağıtım simülasyonu
python tests/parite.py --model model/gelistirme/model.onnx
cd app && npm run lint && npm run build
npx cypress run                            # uygulama çalışırken (app/README-cypress.md)
```

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
- Cypress testleri ve tarayıcı paritesi geliştirme ortamında koşturulamadı; CI iş akışı (`.github/workflows/test.yml`) bunları çalıştırmak üzere hazır.
- `onnxruntime-web` WASM dosyası ilk yüklemede ~3.7 MB (gzip) indirilir.

## Araçlar

Google Stitch (tasarım) → Google AI Studio (v1 uygulaması) → Cypress (E2E) → scikit-learn, skl2onnx, onnxruntime / onnxruntime-web (v2.0). v1 uygulama kodu AI Studio tarafından üretildi; v1 spec, tasarım kararları, eval ve ürün kararı bana ait.

## Kodlama aracı beyanı (v2.0)

- **Kullanılan araç:** v2.0 kodu, Claude (Anthropic, Claude Opus 5.5) ile claude.ai sohbet arayüzündeki kod çalıştırma ortamında yazıldı.
- **Aracın yaptıkları:** Repo denetimi, spec §11–§20 taslağı, veri şeması, sentetik üretici, `train.py`, ONNX dönüşümü, tarayıcı entegrasyonu, Python Oracle, testler ve belgeler.
- **Araç tarafından verilen mühendislik kararları:**
  - Etiket tanımı, özellik seti, 0.65 eşiği ve kabul kapıları.
  - Tarayıcı içi çıkarım.
  - Kabul edilmemiş modelin yalnızca gölgede çalışması.
  - Kapı geçmeyince eşiğin veya üreticinin değiştirilmemesi.
- **Gerçekten çalıştırılan testler:** 31 pytest testi, TS↔Python özellik sözleşmesi, Node üzerinde ORT-web paritesi, dağıtım simülasyonu, `tsc` ve `vite build`. Cypress testleri yazıldı ama araç ortamında Cypress ikilisi indirilemediği için **koşturulmadı**.
- **İnsan incelemesi:** _[Şevval Sunar: hangi dosyaları inceleyip neleri değiştirdiğini buraya kendin yaz.]_
