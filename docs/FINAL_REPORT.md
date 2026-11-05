# Son rapor — KARA KUTU v2.0

Tarih: 2026-11-05 (UX turu sonrası güncellendi) · Başlangıç durumu: [`FINAL_AUDIT.md`](FINAL_AUDIT.md) · Ödev gereksinimleri: [`IZLENEBILIRLIK.md`](IZLENEBILIRLIK.md) · Simüle UX değerlendirmesi: [`UX_DEGERLENDIRME.md`](UX_DEGERLENDIRME.md) · Ham kanıtlar: [`kanit/`](kanit/)

**Özet:** Uyarlama mekanizması uygulandı ve gerçek tarayıcıda, hem dev sunucusunda hem üretim derlemesinde doğrulandı. Model kabul kapılarını **geçmedi**, reddedildi statüsünde kalıyor ve yayınlanmadı. Normal kullanıcıda yalnızca gölgede çalışıyor. Bunu değiştirebilecek tek şey en az 15 gerçek oturumdan oluşan veri.

## Durum tablosu

Aşağıdaki sonuçların tamamı son kod üzerinde bu aşamada yeniden koşturuldu.

| Madde | Statü | Kanıt |
|---|---|---|
| Repo bütünlüğü | PASS | Git geçmişi korundu; patch tekrar uygulanmadı; temiz klonda `git status` temiz; gizli anahtar taraması temiz |
| Temiz ortamda README komutları | PASS | Yeni klonda `pip install`, `birlestir.py` (0), `train.py` (1, beklenen), `npm ci`, `npm run build`, 55/55 pytest (`kanit/temiz-ortam.txt`) |
| Mevcut Primer (v1 regresyonu) | PASS | Gerçek Chromium: dev 19/19, üretim derlemesi 19/19 |
| pytest | PASS | 55/55 (`kanit/python-ve-derleme.txt`) |
| TypeScript | PASS | `tsc --noEmit` temiz |
| Vite build | PASS | Temiz; `sync-model` reddedilmiş modeli kopyalıyor |
| Gerçek tarayıcı testleri (Cypress senaryolarının puppeteer portları) | PASS | Headless Chromium 153: dev 41/41, üretim derlemesi 41/41, UX testleri dahil (`kanit/tarayici-{dev,uretim}-*.json`) |
| Cypress dosyalarının kendisi | BLOCKED (yerel) | `download.cypress.io` erişilemez. CI'da üretim derlemesine karşı koşacak şekilde yapılandırıldı. **Puppeteer portları Cypress'in yerine geçmez**: aynı senaryolar, farklı test çatısı |
| Cypress CI koşusu | REQUIRES HUMAN ACTION | Push yetkisi yok; CI çalıştırılmadı ve başarılı olduğu iddia edilmiyor |
| Tarayıcı çıkarımı | PASS | Dev, üretim ve GitHub Pages alt yolu (`/Kara_Kutu/`); model SHA-256 doğrulaması tarayıcıda |
| Python Oracle | PASS | 5 referans ve 34 sınır girdisi, fark 0 |
| Diferansiyel parite (< 1e-4) | PASS | Gerçek tarayıcı: 5/5 referansta fark 0; 34 girdilik sınır kümesinin tamamı tolerans içinde. Node ORT-web: 39 girdi, en büyük fark 1.79e-7 |
| Veri toplama hattı | PASS | Tarayıcıdan indirilen test CSV'leri doğrulayıcıdan geçti ve birleştirici `kaynak=test` olduğu için reddetti; `--gecersizleri-atla`, tekrar, tamlık ve rapor testleri geçti |
| Gerçek oturumlar | REQUIRES HUMAN ACTION | **0/15.** Uydurulmadı |
| Sentetik üretici | PASS | Aynı tohum → aynı dosya; veri sürümü `7dae87520a30` |
| Eğitim tekrarlanabilirliği | PASS | Yapıtlar bayt bayt aynı (`model.onnx` sha256 `b91ba53e…`) |
| Model kabul kapısı | FAIL | Dengeli doğruluk 0.527 < 0.70, F1 0.245, recall 0.171, gerçek veri 0/15. Kapılar değiştirilmedi |
| Kalibrasyon | FAIL (bulgu) | Brier 0.236 > sabit taban oran tahmincisi 0.225; ortalama tahmin 0.491, gözlenen oran 0.341. Model değiştirilmedi |
| ONNX yapıtı | PASS (yalnızca `gelistirme/`) | sklearn ↔ ONNX farkı 2.6e-7; statü reddedildi, dağıtım modu gölge |
| Yayın koruması | PASS | 10 test: reddedilmiş, aday, geçmeyen kapı, özet uyuşmazlığı ve eksik dosya durumlarının hepsi reddediliyor; commit sabitleme şeması yalnızca 40 haneli SHA kabul ediyor |
| Hugging Face yayını | BLOCKED | Kabul edilmiş model yok; `v2.0` etiketi oluşturulmadı |
| Demo videosu | PASS | `docs/demo/kara-kutu-v2.0-demo.mp4`: 77 sn, UX düzeltmelerinden sonra yeniden kaydedildi; gerçek uygulama ve çıkarım; red statüsü ve geçersiz kılma hem altyazıda hem uygulamanın DENEYSEL MOD şeridinde |
| Simüle UX değerlendirmesi | PASS | 3 profil, 13 ekran (önce/sonra), otomatik erişilebilirlik ölçümleri; 7 bulgu düzeltildi ve testlendi (`UX_DEGERLENDIRME.md`, `docs/ux/`). **İnsan değerlendirmesi değildir** |
| Profil bazlı model analizi | PASS (teşhis) | Aşırı uyum yok (AUC eğitim 0.658 / test 0.651); kör noktalar: hızlı-yanılan oyuncu (FN %96.6), ipucu kullanan (FP %51.6) (`MODEL_ROOT_CAUSE_ANALYSIS.md` §8) |
| SINAV_TASARIMI.md (≤ 1 sayfa) | PASS | 343 kelime; A4, 10.5 pt'de 1 sayfa |
| README | PASS | Komutlar temiz klonda doğrulandı; beyan 5 madde; inceleme kaydı araç ve sahip için ayrı |
| İnsan değerlendirmesi | REQUIRES HUMAN ACTION | README → "Human Evaluation" şablonu. Simüle değerlendirme bunun yerine geçmez |

## Bu aşamada bulunan ve düzeltilen hatalar

1. **Debug paneli oyunu örtüyordu.** 390 px ekranda oyun kontrollerinin üstüne biniyordu.
2. **Eksik model yanıltıcı hata veriyordu.** SPA sunucusu 200 + HTML döndürüyordu.
3. **Test oturumları gerçek veriye karışabilirdi.** Artık `kaynak=test` yazıyorlar.
4. **Test koşucusu kapatılmış sayfada çöküyordu.**
5. **Demo kaydı çok yavaştı.** Gerçek zamanlı VP9 kodlaması nedeniyle.
6. **`with-server.sh` sunucuyu kapatamıyordu.** Sunucu yerine alt kabuğun PID'sini tutuyordu; ikinci koşu eski sunucuya bağlanmıştı.
7. **SINAV_TASARIMI.md iki sayfaydı.**
8. **Doğrulayıcı test oturumlarını saymıyordu.**

Ayrıca bir risk giderildi: CI'daki Cypress, Vite dev sunucusunun yeniden yükleme riskine karşı üretim derlemesine taşındı.

## Simüle UX turu: bulunan ve düzeltilen sorunlar

| # | Bulgu (gerçek tarayıcıda gözlendi/ölçüldü) | Düzeltme | Test |
|---|---|---|---|
| U1 | Debug çipi tutor'un gönder butonunu, kavram özetini ve veri modunda rol seçeneklerini örtüyordu | Panel sabit konumdan çıkıp sayfa akışına alındı | `ux` |
| U2 | Seçenekler 42 px, ipucu 36 px, tutor girişi ve gönder 34 px (`DESIGN.md` ≥ 44 px) | 44–48 px | `ux`, `ux.cy.js` |
| U3 | Zorlanan oyuncudan destek K3'te geri çekiliyordu (p 0.730 → 0.578) | Destek sürekliliği (spec §14 madde 4, KÖ10) | KÖ10 |
| U4 | "Nöbeti devral" pasifken nedeni yazmıyordu | `start-hint` | `ux` |
| U5 | Uyarlama notu belirsizdi | Dayanağını ve not olmadığını söylüyor | KÖ6 |
| U6 | Geçersiz kılma yalnızca panelde görünüyordu | DENEYSEL MOD şeridi (spec §14 madde 5) | `ux` |
| U7 | Son ekranda öğrenme geri bildirimi yoktu; ilk düzeltmede aynı kavram iki kez listelendi | Tekilleştirilmiş kavram kartı (yalnızca öğrenme hedefinde) | `ux` (2 test) |

Ayrıca demo betiğindeki altyazı katmanı uygulamanın DENEYSEL şeridini örtüyordu; altyazılar alta taşındı ve video yeniden kaydedildi.

**Düzeltilmeyen (öneri olarak bırakılan):**
- 10 px mono etiketler (tasarım dili; ekran başına 9–18).
- Uzun brifing.
- Uyarlamanın kullanıcıya tahmin edilemez olması.
- Hızlı-yanılan oyuncu kör noktası (v2.1 ön kayıt adayı).

## Çalıştırılan komutlar

```bash
python -m pytest -q tests                                                  # 55 passed
python data/validate_dataset.py data/oturumlar.csv                         # GEÇERLİ
python data/generate_synthetic.py --cikti /tmp/s.csv && cmp /tmp/s.csv data/sentetik.csv
python tests/parite.py --model model/gelistirme/model.onnx                 # fark 0
python tests/parite.py --sinir --model model/gelistirme/model.onnx         # fark 0
cd app && node scripts/parity-web.mjs                                      # 39 girdi, en büyük 1.79e-7
python scripts/publish_hf.py --repo x/y --kuru                             # YAYIN REDDEDİLDİ, çıkış 1
python train.py                                                            # çıkış 1, model/ köküne yazılmadı
cd app && npx tsc --noEmit && npm run build
cd tools/browser-e2e
./with-server.sh node run.mjs yollar kabul                                 # 19/19
./with-server.sh node run.mjs adaptif model parite veri veriHatti ux       # 22/22
PROD=1 ./with-server.sh node run.mjs yollar kabul                          # 19/19
PROD=1 ./with-server.sh node run.mjs adaptif model parite veri veriHatti ux  # 22/22
./with-server.sh node ux-turu.mjs                                         # UX turu: 13 ekran + ölçümler
./with-server.sh node demo.mjs                                            # 77 sn demo
python analysis/profil_analizi.py                                          # profil bazlı teşhis
python analysis/kok_neden.py                                               # teşhis + kalibrasyon
```

## Soruların cevapları

**0. Bu turda ne değişti?**
Gerçek uygulama, üç kullanıcı profiliyle gerçek tarayıcıda oynatıldı. 7 kullanılabilirlik sorunu bulunup düzeltildi ve testlendi; 6 yeni tarayıcı testi ve 5 Cypress testi eklendi. Profil bazlı model analizi yapıldı. Demo yeniden kaydedildi. README'ye simüle değerlendirme ile insan değerlendirmesi şablonu ayrı ayrı yazıldı.

**1. Ödev gereksinimlerinin hangileri tamamlandı?**
26 gereksinimin 21'i PASS, 3'ü BLOCKED, 1'i FAIL, 1'i insan eylemi gerektiriyor (tablodan otomatik sayıldı).
- **FAIL:** kabul kapısı; bu, kapı doğru çalıştığı için alınan geçerli bir sonuç.
- **BLOCKED:** kapıya bağlı ana model dosyaları, Hugging Face yayını ve yerel Cypress.
- **İnsan eylemi:** 15 gerçek oturum. CI koşusu ve kişisel inceleme de insan eylemi bekliyor ama tabloda ayrı satır değil; ilgili satırların içinde belirtildi. Tam tablo: `IZLENEBILIRLIK.md`.

**2. Hangi testler gerçekten çalıştı?**
- 55 pytest testi
- `tsc` ve `vite build`
- Node ORT-web paritesi (39 girdi)
- Gerçek Chromium'da 41 senaryo dev sunucusunda, 41 senaryo üretim derlemesinde (UX testleri dahil)
- Temiz klonda README komutları
- Dağıtım simülasyonu (pytest içinde)

**3. Cypress gerçekten çalıştı mı?**
Hayır. Cypress ikilisi bu ortamdan indirilemiyor. Cypress dosyaları CI'a bırakıldı ve CI henüz çalıştırılmadı. Aynı senaryoların puppeteer portları gerçek Chromium'da geçti; bu güçlü bir işaret, ama Cypress'in kendi koşusunun yerine geçmez.

**4. Model kabul kapısını geçti mi?**
Hayır. Dengeli doğruluk 0.527, gerekli 0.70. Bayes tavanı (0.586) bu hedef ve sentetik veriyle kapının erişilemez olduğunu gösteriyor.

**5. Kaç gerçek oturum mevcut?**
0. Gerekli 15.

**6. Model yayınlandı mı?**
Hayır. Kabul edilmiş model yok; yayın betiği reddediyor ve `v2.0` etiketi oluşturulmadı.

**7. Tarayıcı çıkarımı ve Python paritesi doğrulandı mı?**
Evet. Gerçek Chromium'da dev ve üretim derlemesinde, 5 referans ve 34 sınır girdisi < 1e-4; 5 referansta fark 0. Oyun akışından üretilen olasılıklar da (0.7303 ve 0.2929) Python ile aynı.

**8. Demo videosu gerçekten oluşturuldu mu?**
Evet. `docs/demo/kara-kutu-v2.0-demo.mp4`, 76 sn, gerçek uygulama ve gerçek çıkarımla. Uyarlama `?rollout=on` geliştirici geçersiz kılmasıyla gösteriliyor; bu, red statüsüyle birlikte videonun başında ve panelde belirtiliyor.

**9. İnsan incelemesi gerektiren bölümler neler?**
README'deki "Human Evaluation" şablonu.
- Simüle UX değerlendirmesi doldurulmuş durumda, ama bir insanın deneyimi değil.
- Doğrulanması gereken en önemli hipotezler: uyarlamanın tahmin edilemezliği kafa karıştırıyor mu, kavram özeti gerçekten öğretici mi, 10 px etiketler telefonda okunuyor mu?

**10. Kullanıcının dışarıdan yapması gereken zorunlu işlem kaldı mı?**
Evet, iki tane; ikisi de bu ortamdan yapılamaz.
- **Gerçek veri:** 15 gerçek katılımcıdan oturum toplamak (`docs/KATILIMCI.md`). Modelin kabul edilip edilemeyeceğini ancak bu belirler.
- **Push ve CI:** Repoyu GitHub'a push edip CI'ın ilk koşusunu gözden geçirmek. Cypress ilk kez orada koşacak.

İsteğe bağlı olanlar:
- README'deki "Human Evaluation" şablonunu doldurmak (en az bir gerçek kişiyle).
- Model kabul edilirse `HF_TOKEN` ile yayın yapmak.

## Başlatma

```bash
pip install -r requirements.txt
cd app && npm install
npm run dev        # http://localhost:3000   ·  ?debug=1 geliştirici paneli  ·  ?veri=1 veri toplama
```

## Dürüst sınırlamalar

- UX değerlendirmesi betiklenmiş profillerle yapıldı; gerçek kullanıcı tepkisi ölçülmedi.
- Tarayıcı testleri tek motorda (Chromium 153) koştu; Firefox, Safari ve gerçek bir telefonda dokunmatik kullanım denenmedi.
- Google Fonts sandbox'ta yüklenemedi; testler ve video yedek yazı tipleriyle koştu.
- Derleme ORT WASM dosyasını hem `assets/` hem `ort/` altına koyuyor (~14 MB yinelenen dağıtım boyutu). Tarayıcı yalnızca `ort/` kopyasını indiriyor.
- Tüm model metrikleri sentetik üreticinin varsayımlarını yansıtır; gerçek oyuncu başarısı hakkında bir şey söylemez.
- Olasılıklar kalibre değil; panelde görünen p bir sıralama puanıdır, "%p olasılık" anlamına gelmez.
