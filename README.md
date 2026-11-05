# KARA KUTU: Otonom Yaşam Destek Krizi · v2.0 Adaptif Primer

YZM301 · SE Primer ödevi · Şevval Sunar

Saat 03:14. Yapay zekâ destekli yoğun bakım ağı ICU-Net siber saldırı altında ve 300 hastanın cihazına yanlış komutlar gidiyor. Nöbetçi mühendis sensin. Oyuncu üç mühendislik kararı verir (mimari, veri ve test, güvenlik ve KVKK). Her karardan sonra uygulama kararın teknik sonucunu ve nedenini gösterir. Takılan oyuncuya bir AI tutor cevabı söylemeden, soru sorarak yol gösterir.

**v2.0** buna davranışa duyarlı bir katman ekler. Oyuncunun karar süresi, tereddüdü, ipucu kullanımı ve önceki seçimleri küçük bir tablo modeline verilir. Model, oyuncunun bir sonraki kararda zorlanma olasılığını tahmin eder. Olasılık eşiği geçerse oyun kavram özeti ekler, tutor'u kendiliğinden açar ve süre baskısını azaltır.

> **Durum (dürüst özet):** v2.0 altyapısı çalışıyor ve gerçek tarayıcıda doğrulandı. Ancak eğitilen model **kabul kapılarını geçmedi** (dengeli doğruluk 0.527 < 0.70) ve yalnızca sentetik veriyle eğitildi; 0/15 gerçek oturum toplandı. Model bu yüzden yayınlanmadı ve uygulamada varsayılan olarak yalnızca **gölge modda** çalışır.
>
> Ayrıntılar: [`docs/FINAL_REPORT.md`](docs/FINAL_REPORT.md) · [`docs/IZLENEBILIRLIK.md`](docs/IZLENEBILIRLIK.md) (ödev gereksinimleri) · [`docs/MODEL_ROOT_CAUSE_ANALYSIS.md`](docs/MODEL_ROOT_CAUSE_ANALYSIS.md) · [`RELEASE.md`](RELEASE.md)

## Linkler

- **Canlı uygulama (GitHub Pages):** [KARA KUTU](https://sevvaalsunar.github.io/Kara_Kutu/) · veri toplama: `?veri=1` · geliştirici paneli: `?debug=1`
- **AI Studio sürümü:** [KARA KUTU — AI Studio](https://ai.studio/apps/0d3c42eb-7942-4398-a0f7-80546707e3c9)
- **v1 demo videosu (60 sn):** [app/cypress/videos/00-demo.cy.js.mp4](app/cypress/videos/00-demo.cy.js.mp4)
- **v2.0 demo videosu (77 sn):** [docs/demo/kara-kutu-v2.0-demo.mp4](docs/demo/kara-kutu-v2.0-demo.mp4). Uyarlama, geliştirici geçersiz kılmasıyla gösterilir; videoda açıkça belirtilir ([`docs/DEMO.md`](docs/DEMO.md)).
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
cd tools/browser-e2e && npm install && ./with-server.sh node run.mjs              # gerçek Chromium: 41 test (dev sunucusu; üretim için PROD=1)
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
- **Doğrulama sırasında bulunan hatalar:** 8 teknik hata ve simüle UX turunda 7 kullanılabilirlik sorunu bulundu ve düzeltildi; listeler `docs/FINAL_AUDIT.md` ve `docs/UX_DEGERLENDIRME.md`'de.

## İnceleme kaydı

### Araç tarafından yapılan teknik incelemeler (yapıldı)

- [x] Spec §11–§20 ile `data/schema.py`, `app/src/ml/features.ts` ve `train.py` arasındaki tutarlılık. Formül eşitliği 60 oturumluk TS↔Python sözleşme testiyle doğrulandı.
- [x] Etiket sızıntısı: gruplu bölme ve tek özellik AUC'si ≤ 0.98; özellikler yalnızca geçmişten hesaplanıyor.
- [x] Kabul kapısı ve yayın koruması: başarısız eğitimin, aday ve reddedilmiş modelin ve özet uyuşmazlığının yayını engellediği testlerle gösterildi.
- [x] Gizlilik: CSV'de kişisel veri sütunu yok; doğrulayıcı böyle sütunları reddediyor; veri sunucuya gitmiyor.
- [x] Tutor kuralı (§7): uyarlama destek metinleri seçenek adı veya harfi içermiyor (otomatik test).
- [x] Gizli anahtar taraması: repoda token veya API anahtarı yok.
- [x] Mobil düzen: 390 px ekranda oyun kontrollerinin örtülmediği gerçek tarayıcıda doğrulandı (hata #1 düzeltildi).

## Simulated User Experience Evaluation

> **Uyarı:** Bu bölüm, kodlama aracı (Claude) tarafından yapılmış **senaryo tabanlı, simüle** bir değerlendirmedir. Gerçek bir kullanıcının ya da repo sahibinin deneyimi değildir.
>
> - Gerçek uygulama, gerçek tarayıcıda üç betiklenmiş profille oynatıldı (`tools/browser-e2e/ux-turu.mjs`).
> - Model **reddedildi** statüsünde; uyarlama `?rollout=on` geliştirici geçersiz kılmasıyla gözlendi.
> - Gerçek kullanıcı testi yapılmadı; gerçek kullanıcı verisi yok (0/15).
>
> Ayrıntılar, ölçümler ve önce/sonra ekranları: [`docs/UX_DEGERLENDIRME.md`](docs/UX_DEGERLENDIRME.md).

**Profiller:**
- **P1 (hızlı, ipucusuz):** p = 0.34, standart akış.
- **P2 (uzun düşünen, tutor kullanan):** p = 0.49, ek destek yok.
- **P3 (zorlanan, riskli seçen):** p = 0.73 → 0.58 → 0.48; kavram özeti ve ek destek.

### Strengths
- Kriz anlatısı, oyun saati ve geri alınamaz seçimler, karar baskısını inandırıcı biçimde kuruyor.
- "Ne oldu / Neden oldu" ayrımı ve kavram etiketleri her seçimi bir yazılım mühendisliği ilkesine bağlıyor.
- Ek destek soruları cevabı söylemiyor, soruyla bitiyor (§7; otomatik test).
- Normal kullanıcı, kabul edilmemiş modelden hiç etkilenmiyor (gölge mod; test edildi).
- 360 px'te yatay taşma yok; model yüklenemezse oyun v1 kurallarıyla sorunsuz sürüyor.

### Weaknesses
- **Uyarlama tahmin edilemez.** 45 sn düşünüp tutor'a soru soran P2 destek almadı, P3 aldı. Kullanıcı açısından kural görünmez.
- **Model kör noktaları.** Hızlı ama yanılan oyuncuya neredeyse hiç destek verilmiyor; her kararda ipucu açanların yaklaşık yarısına gereksiz destek veriliyor (sentetik analiz, `MODEL_ROOT_CAUSE_ANALYSIS.md` §8).
- **Olasılıklar kalibre değil.** Panelde görünen p bir yüzde değil, bir sıralama puanı.
- **Brifing uzun.** 390 px'te sorular ekranın altında kalıyor.
- **Küçük metin.** Ekran başına 9–18 metin 11 px'in altında (tasarımın 10 px mono etiketleri).

### Usability Findings

Bu turda bulunan ve düzeltilen sorunlar (testlerle doğrulandı):
1. Debug çipi tutor'un gönder butonunu ve içeriği örtüyordu → panel sayfa akışına alındı.
2. Seçenek ve tutor kontrolleri 34–42 px'ti (`DESIGN.md` ≥ 44 px istiyor) → 44–48 px.
3. "Nöbeti devral" pasifken nedeni yazmıyordu → eksik adım gösteriliyor.
4. Zorlanmaya devam eden oyuncudan destek geri çekiliyordu → destek sürekliliği kuralı (spec §14 madde 4, KÖ10).
5. Geliştirici geçersiz kılması yalnızca panelde görünüyordu → oyunun üstünde "DENEYSEL MOD" şeridi.

### Learning Experience
- Kavram özeti, hatanın hemen ardından ilkeyi açıklıyor; zamanlama öğrenme için doğru.
- Son ekran önceden yalnızca "KRİTİK HATA" listesi gösteriyordu. Artık "Kavramları öğrenmek" hedefinde kavram kartı var (UYGULADIN / TEKRAR ET); "Kendimi sınamak" hedefinde spec §4 gereği gizli.
- Doğru yolu son ekranda açıklamamak tekrar oynamayı teşvik ediyor. Ancak iki-üç denemede doğru yolu bulamayan öğrenci için bir çıkış yolu yok.
- Uygulamanın bir yazılım mühendisliği öğrenme deneyimi olduğu girişte açıkça söylenmiyor; yalnızca hedef sorusundan anlaşılıyor.

### Accessibility and Clarity
- Bütün oyuncu kontrolleri ≥ 44 px. Onay kutusunun kendisi küçük, ama 48 px'lik etiketinin tamamı tıklanabilir.
- Erişilebilir adı olmayan buton yok; ipucu butonu `aria-expanded` taşıyor; DENEYSEL şeridi `role="status"`.
- Uyarlama notu artık neye dayandığını ve bunun bir not olmadığını söylüyor.
- **Değerlendirilmedi:** ekran okuyucu, klavye ile gezinme, renk kontrastı ölçümü, gerçek dokunmatik.

### Recommended Improvements
1. Giriş ekranına uygulamanın amacını ve (model kabul edilirse) oyunun davranışa göre uyarlandığını söyleyen bir cümle eklemek.
2. 10 px mono etiketleri en az 11–12 px'e çıkarmak, brifingi kısaltmak ya da katlanabilir yapmak.
3. İki başarısız denemeden sonra isteğe bağlı "doğru yolu göster" seçeneği.
4. v2.1 ön kaydı: hızlı-riskli etkileşimi, `next_scene`, kalibre olasılıklar (`MODEL_ROOT_CAUSE_ANALYSIS.md` §6, §8).
5. Gerçek kullanıcı testi: sesli düşünme protokolü, kısa SUS anketi; telefon, ekran okuyucu ve klavye ile.

### Evaluation Limitations
- Betiklenmiş profiller insan değil; okuma, kafa karışıklığı, motivasyon ve öğrenme ölçülmedi.
- Karar süreleri saat ilerletilerek simüle edildi.
- Tek tarayıcı motoru (Chromium 153); gerçek telefon, ekran okuyucu ve klavye ile denenmedi.
- Google Fonts yüklenemedi.
- Tutor test modunda sabit cevap verdi.
- Model sentetik veriyle eğitildi ve reddedildi. Uyarlama yalnızca geliştirici geçersiz kılmasıyla görüldü; normal kullanıcı bu deneyimi yaşamıyor.

## Human Evaluation

> Bu bölüm **yalnızca gerçek bir kişi** tarafından doldurulabilir. Araç burada hiçbir görüş, onay veya imza uydurmaz. Gerçek kullanıcı değerlendirmesi henüz yapılmadı.

| Alan | Doldurulacak |
|---|---|
| Değerlendiren / tarih / cihaz | … |
| Oynanan yol(lar) ve seviye | … |
| İlk açılışta ne yapacağımı anladım mı? (1–5) | … |
| Kavram özeti ve ek destek işe yaradı mı? (1–5, kısa not) | … |
| Kafamı karıştıran yer | … |
| Simüle değerlendirmeyle uyuşmayan bulgu | … |
| Repo sahibinin onayı: okuduğum ve onayladığım bölümler | … |
