# Simüle kullanıcı deneyimi değerlendirmesi — KARA KUTU v2.0

> **Bu bir insan değerlendirmesi değildir.** Değerlendirmeyi kodlama aracı (Claude) yaptı: gerçek uygulama, gerçek tarayıcıda (headless Chromium 153), betiklenmiş üç kullanıcı profiliyle oynatıldı. Ekran görüntüleri ve otomatik ölçümler alındı. Hiçbir gerçek kullanıcı katılmadı. Bulgular, gerçek bir öğrencinin ne düşüneceği hakkında kanıt değil, **hipotezdir**. Gerçek kullanıcı testi henüz yapılmadı ve gerçek kullanıcı verisi yok (0/15).

## Yöntem

| | |
|---|---|
| Uygulama | Gerçek uygulama (`npm run dev`), gerçek ONNX modeli. Model **reddedildi** statüsünde; uyarlamayı görebilmek için `?rollout=on` geliştirici geçersiz kılması kullanıldı. Normal kullanıcı (parametresiz) ayrıca incelendi. |
| Betik | `tools/browser-e2e/ux-turu.mjs`. Karar süreleri tarayıcı saati ilerletilerek simüle edildi. |
| Ekran | 390×844 (hedef telefon) ve 360×740 (en dar hedef) |
| Ölçümler | 44 px'ten küçük dokunma hedefleri, 11 px'ten küçük metin, erişilebilir adı olmayan buton, yatay taşma (`docs/ux/olcumler*.json`) |
| Kanıt | Düzeltme öncesi `docs/ux/ekranlar-oncesi/`, sonrası `docs/ux/ekranlar/` (13'er ekran) |
| Mock | Tutor `?test=1` ile sabit cevap verir (Gemini çağrılmaz). Model ve olasılıklar gerçek. |

## Profiller ve gözlenen model davranışı

| Profil | Oynanış | Gerçek model olasılıkları | Deneyim |
|---|---|---|---|
| **P1 — Hızlı, ipucusuz** | Deneyimliyim · Kendimi sınamak · 6–8 sn'de 1B → 2B1 → A | 0.339 → 0.344 → 0.342 | Standart akış; 60 sn sayaç; iyi son; kavram kartı yok (sınama hedefi) |
| **P2 — Uzun düşünen, tutor kullanan** | Yeni başladım · Kavramları öğrenmek · 45–50 sn, tutor'a soru, doğru seçimler | 0.490 → 0.429 | Tutor zaten açık (seviye kuralı); ek destek yok |
| **P3 — Zorlanan, riskli seçen** | Biraz deneyimim var · 40 sn + ipucu → 1A; 30 sn → 2A1; 20 sn → B | 0.730 → 0.578 → 0.485 | K1 sonrası kavram özeti ve K2'de ek destek. **Düzeltmeden önce K3'te destek geri çekiliyordu.** |

## Talimattaki sorulara cevaplar (mevcut davranışa dayalı)

| Soru | Cevap |
|---|---|
| İlk açılışta ne yapacağı anlaşılıyor mu? | Büyük ölçüde evet: kriz brifingi ve üç soru var. Ancak brifing uzun; 390 px'te sorular ekranın altında kalıyor, kaydırma gerekiyor. Düzeltmeden önce "Nöbeti devral" pasifken nedeni yazmıyordu; artık eksik adımı söylüyor. |
| Oyun mekanikleri anlaşılır mı? | Evet: karar etiketi, adım göstergesi, A/B kartları, "Seçim geri alınamaz" notu ve oyun saati net. |
| Karar süresi ve ipucunun etkisi anlaşılıyor mu? | **Hayır.** Oyuncuya davranışının izlendiği yalnızca veri modunda (gizlilik notu) ve uyarlama gerçekleştikten sonra söyleniyor. Not artık süre, ipucu ve seçimlerin dikkate alındığını yazıyor; önceden bunu da söylemiyordu. |
| Tutor'un ne zaman açılacağı tahmin edilebilir mi? | **Hayır.** P2 45 sn düşünüp tutor'a yazdı ama destek almadı (p = 0.49); P3 aldı. Kullanıcı açısından kural görünmez. Bu tasarım gereği olabilir, ama şaşırtıcı. |
| Uyarlama yardımcı mı, dikkat dağıtıcı mı? | Kavram özeti "Neden oldu"dan sonra geliyor ve öğretici. Ek destek balonu tutor kutusunu uzatıyor ama giriş alanını örtmüyor. Düzeltmeden önce destek, zorlanan oyuncudan K3'te geri çekiliyordu; bu tutarsızdı ve düzeltildi. |
| Kullanıcı modelin ne tahmin ettiğini anlıyor mu? | Hayır, bilerek gizli (spec §14). Not artık bunun bir not ya da değerlendirme olmadığını söylüyor. |
| Yanlış tahmin güveni etkiler mi? | Gereksiz destek (FP) görünür: her kararda ipucu açanların yaklaşık yarısında gereksiz (`MODEL_ROOT_CAUSE_ANALYSIS.md` §8). Bu, "beni yetersiz mi sanıyor?" tepkisi doğurabilir. Kaçırılan destek (FN) ise görünmez: hızlı ama yanılan oyuncu hiçbir şey fark etmez, yalnızca desteği kaçırır. |
| Debug paneli deneyimi bozuyor mu? | Normal kullanıcı paneli hiç görmüyor. `?debug=1` ile önce sabit konumdaydı ve tutor'un **gönder** butonunu, kavram özetini ve veri modunda rol seçeneklerini örtüyordu. Artık sayfa akışında ve hiçbir kontrolü örtmüyor (test edildi). |
| Mobilde kontroller rahat mı? | Düzeltmeden önce seviye, rol ve hedef seçenekleri 42 px, ipucu butonu 36 px, tutor girişi ve gönder 34 px idi; projenin kendi `DESIGN.md`'si en az 44 px istiyor. Artık hepsi 44–48 px. 360 px'te yatay taşma yok. Ekran başına 9–18 metin 11 px'in altında (tasarımın 10 px mono etiketleri). |
| Oyun sonunda yeterli geri bildirim var mı? | Düzeltmeden önce kötü sonda üç satır "KRİTİK HATA" vardı ama ne öğrenileceği yoktu. Artık "Kavramları öğrenmek" hedefinde "Bu nöbette karşılaştığın kavramlar" kartı var: her kavram bir kez, UYGULADIN / TEKRAR ET olarak. İlk sürümde aynı kavram iki kez listeleniyordu; düzeltildi. |
| Akademik amaç aktarılıyor mu? | Kısmen. Hedef sorusu ("Kavramları öğrenmek") ve sonuç ekranındaki kavram etiketleri amacı ima ediyor. Ancak giriş ekranı uygulamayı bir yazılım mühendisliği öğrenme deneyimi olarak açıkça tanıtmıyor. |

## Bu turda düzeltilenler

| Bulgu | Düzeltme | Test |
|---|---|---|
| Debug çipi gönder butonunu ve içeriği örtüyordu | Panel sayfa akışında, sabit konumda değil | `ux`: panel hiçbir kontrolü örtmez |
| Dokunma hedefleri 34–42 px | 44–48 px | `ux` + `ux.cy.js`: ≥ 44 px |
| Zorlanan oyuncudan destek geri çekiliyordu | Destek sürekliliği kuralı (spec §14 madde 4, KÖ10) | KÖ10 (p = 0.578 < 0.65 olsa da destek sürer) |
| Pasif başlat butonunun nedeni yazmıyordu | Eksik adım metni (`start-hint`) | `ux` |
| Uyarlama notu belirsizdi | Neye dayandığı ve not olmadığı yazıyor | KÖ6 |
| Geçersiz kılma yalnızca panelde görünüyordu | Oyunun üstünde "DENEYSEL MOD" şeridi | `ux`: yalnızca geçersiz kılmada görünür, normalde görünmez |
| Son ekranda öğrenme geri bildirimi yoktu | Kavram kartı (yalnızca öğrenme hedefinde) | `ux` |
| Kavram kartında tekrar eden kavram | Tekilleştirme | `ux` |

## Ölçümler: önce → sonra

| Ekran | 44 px altı oyuncu kontrolü (önce → sonra) |
|---|---|
| Giriş | 3 (rol seçenekleri 42 px) → 0 |
| Karar (deneyimli) | 1 (ipucu 36 px) → 0 |
| Karar (tutor açık) | 3 (ipucu 36, giriş 34, gönder 34) → 0 |
| Veri modu | 3 rol + onay kutusu → yalnızca onay kutusu (13×16 px; 48 px'lik etiketin içinde, etiket tıklanabilir) |
| Normal kullanıcı girişi | 3 → 0 |

Debug düğmesi (31 px) yalnızca geliştirici modunda görünür ve bu tabloya dahil edilmedi.

## Değerlendirmenin sınırları

- **Betiklenmiş profiller insan değildir.** Okuma hızı, kafa karışıklığı, duygusal tepki ve öğrenme ölçülmedi.
- **Karar süreleri simüle edildi.** Saat ilerletildi; gerçek düşünme yok.
- Tek tarayıcı motoru kullanıldı; gerçek telefon, dokunmatik, ekran okuyucu ve klavye ile gezinme test edilmedi.
- Google Fonts yüklenemedi; ekranlar yedek yazı tipiyle.
- Model sentetik veriyle eğitildi ve reddedildi. Uyarlama yalnızca geliştirici geçersiz kılmasıyla görüldü; normal kullanıcı bunu hiç görmüyor.
- Tutor test modunda sabit cevap verdi; gerçek Gemini cevaplarının kalitesi bu turda değerlendirilmedi (bkz. `eval/`).
