# Demo betiği (60–90 sn) — durum: KAYDEDİLMEDİ

Video henüz kaydedilmedi. Kayıt için iki yol var.

## Otomatik kayıt (önerilen)

```bash
cd app
npm run dev                                                   # terminal 1
npx cypress run --spec cypress/e2e/01-adaptif-demo.cy.js     # terminal 2
```

Video `app/cypress/videos/01-adaptif-demo.cy.js.mp4` olarak kaydedilir (yaklaşık 40–50 sn). Anlatım için üstüne ses eklenebilir.

## Elle kayıt ve anlatım

Adres: `http://localhost:3000/?debug=1&rollout=on`. Telefon görünümü 390 px.

| Süre | Ekranda | Anlatım |
|---|---|---|
| 0–10 sn | Giriş ekranı, sağ altta debug paneli | "KARA KUTU v2.0: oyun artık oyuncunun nasıl oynadığına da bakıyor." |
| 10–30 sn | **Oyuncu A**: Biraz deneyimim var; Karar 1'de ~40 sn bekler, ipucunu açar, A'yı seçer | "Uzun düşündü, ipucuna baktı, riskli seçeneği seçti." |
| 30–45 sn | Sonuç ekranında **Kavram özeti** kartı; panelde p ≈ 0.73, UYARLANDI | "Model bir sonraki kararda zorlanma olasılığını 0.65'in üstünde buldu; oyun ek açıklama ekledi." |
| 45–55 sn | Karar 2: ipucu kutusu kendiliğinden açık, **Ek destek** sorusu | "Seviyesi 'orta' olsa da tutor bu kez kendiliğinden açıldı. Cevabı yine söylemiyor, soru soruyor." |
| 55–75 sn | **Oyuncu B**: yeni sekme, aynı seçimler; Karar 1'de 3 sn içinde B'yi seçer | "Aynı sahne, farklı davranış." |
| 75–90 sn | Sonuç ekranında kavram özeti yok; panelde p ≈ 0.29, standart; Karar 2'de ipucu kapalı | "Akıcı oyuncu standart akışta kaldı. Uyarlama yalnızca gerektiğinde." |

## Videoda söylenmesi gereken dürüstlük notu

Panelde **DENEYSEL** yazar: v2.0 modeli kabul kapılarını geçmedi ve yalnızca sentetik veriyle eğitildi. Uyarlama bu demoda `?rollout=on` geliştirici geçersiz kılmasıyla açıktır; normal kullanıcıda model yalnızca gölgede çalışır. Videoyu kaydeden kişi bunu altyazıda veya anlatımda belirtmelidir.
