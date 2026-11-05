# Demo videosu — KAYDEDİLDİ

**Dosya:** [`docs/demo/kara-kutu-v2.0-demo.mp4`](demo/kara-kutu-v2.0-demo.mp4) · 77 sn · 390×844 · H.264 · 30 fps

Simüle UX turundaki düzeltmelerden sonra (DENEYSEL MOD şeridi, yeni uyarlama notu, sayfa akışındaki geliştirici paneli) **yeniden kaydedildi**. Altyazılar ekranın altındadır; uygulamanın üstteki DENEYSEL MOD şeridini kapatmaz.
**Kayıt günlüğü:** [`docs/demo/kayit-gunlugu.txt`](demo/kayit-gunlugu.txt)

## Nasıl kaydedildi

Gerçek uygulama (`npm run dev`), gerçek headless Chromium 153 ve gerçek ONNX çıkarımı (onnxruntime-web 1.30.0) kullanıldı. Ekran, Chrome DevTools ekran yayınıyla kare kare yakalandı ve kayıttan sonra ffmpeg ile kodlandı.

```bash
cd tools/browser-e2e && npm install && ./with-server.sh node demo.mjs
```

Videodaki iki dürüstlük noktası:

- **Altyazılar** sayfaya enjekte edilmiş bir katmandır ve her altyazı kutusunda "demo katmanı, uygulamanın parçası değildir" yazar.
- **Oyuncu A'nın 40 saniyelik bekleyişi** tarayıcı saati ilerletilerek kısaltıldı; altyazıda belirtilir. Karar süresi özelliği bu ilerletilmiş saatle tam 40 sn ölçülür.

## Akış (kayıt günlüğünden)

| Zaman | Ekranda |
|---|---|
| 0–4 sn | Açılış: gerçek uygulama, gerçek tarayıcı, gerçek ONNX |
| 4–11 sn | **Açıklama altyazısı** + uygulamanın kendi **DENEYSEL MOD** şeridi: model kabul kapılarını geçmedi (0.527 < 0.70, yalnızca sentetik veri); uyarlama `?rollout=on` geliştirici geçersiz kılmasıyla; üretimde yalnızca gölge |
| 11–24 sn | Oyuncu A (Biraz deneyimim var) Karar 1'de bekler (saat ilerletildi, altyazıda belirtilir), ipucunu açar, A'yı seçer |
| 24–32 sn | Model p = 0.730 ≥ 0.65 → sonuç ekranında Kavram özeti ve dayanağını açıklayan not |
| 32–40 sn | Karar 2: tutor kendiliğinden açık, "Ek destek" sorusu |
| 40–58 sn | Oyuncu B, aynı sahne, 3 sn'de ipucusuz B; p = 0.293 → standart akış, kavram özeti yok |
| 58–64 sn | Oyuncu B Karar 2: ipucu kutusu kapalı |
| 64–71 sn | Geliştirici paneli: sürüm, statü **reddedildi**, sha256, "uyarlama: AÇIK · geçersiz kılma", olasılık, gecikme |
| 71–77 sn | Doğrulama özeti: 5 referans + 34 sınır girdisinde parite < 1e-4, gerçek tarayıcıda v1 regresyonu 19/19, model yayınlanmadı |

## Gösterilen ve gösterilmeyen

- **Gösterilen:** uyarlama **mekanizması**. Gerçek model, gerçek olasılık hesaplıyor ve oyun bu olasılığa göre değişiyor.
- **Gösterilmeyen:** üretimde onaylı model davranışı. v2.0 modeli reddedildi; normal kullanıcıda yalnızca gölgede çalışır.
