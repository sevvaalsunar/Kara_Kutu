# DESIGN.md — KARA KUTU

> Google Stitch ile üretilen 5 mobil ekranın tasarım sistemi. Ekran görüntüleri: `design/` klasörü.
> Metin içeriğinin kaynağı spec.md'dir; bu belge yalnızca görünümü tanımlar.

## Atmosfer

Gece nöbeti, siber olay, klinik terminal. Koyu, yoğun, veri odaklı; alarm rengi az ve anlamlı kullanılır. Ekran, oyuncuya bir olay müdahale konsolunun içinde olduğunu hissettirir.

## Renkler

| Rol | Hex | Kullanım |
|---|---|---|
| Primary | `#0EA5E9` | Seçili durum, birincil butonlar, bağlantılar, tutor vurgusu |
| Secondary | `#F59E0B` | Uyarı, son tarih, "Neden oldu" başlığı, manuel izlem gibi dikkat gerektiren durumlar |
| Tertiary | `#EF4444` | Yalnızca alarm ve kötü son: kritik hata, "Sistem Kurbanı" |
| Neutral | `#0A101D` | Arka plan (en koyu ton) |

Kartlar ve yüzeyler Neutral'ın bir iki ton açığıdır; kenarlıklar ince ve düşük kontrastlıdır.

**Kurallar**

- Seçili durum her yerde aynıdır: Primary kenarlık ve "SEÇİLDİ" etiketi.
- Karar ekranında iki seçenek kartı birebir aynı görünür; hiçbiri vurgulanmaz ve risk etiketi taşımaz.
- Kırmızı yalnızca kötü sonu ve kritik hatayı işaret eder; seçim veya süs için kullanılmaz.

## Tipografi

| Rol | Yazı tipi | Kullanım |
|---|---|---|
| Başlık | Space Grotesk | Ekran ve sahne başlıkları, son başlıkları |
| Gövde | Chivo | Sahne metni, seçenek açıklamaları, "Ne oldu / Neden oldu" metinleri |
| Etiket | JetBrains Mono | Saat, son tarih, karar etiketleri ("KARAR 1 · MİMARİ"), durum etiketleri, sistem notları |

Etiketler büyük harf ve hafif harf aralığıyla yazılır. Saat ve son tarih her zaman monospace'tir.

## Bileşenler

- **Üst çubuk:** "KARA KUTU" logosu, oyun içi saat, "Son: 03:29" etiketi, "Deneyimliyim" modunda 60 saniyelik geri sayım halkası.
- **Karar etiketi:** Çerçeveli küçük etiket ("KARAR 1 · MİMARİ") ve sağda adım göstergesi ("1/3 ADIM").
- **Sahne kartı:** Büyük gövde metni, altında monospace bağlam satırı (ör. "ETKİLENEN HASTA: 300").
- **Seçenek kartı:** Sol üstte harf rozeti (A/B), kalın başlık, bir satır açıklama. Kutucuk yoktur; karta dokunmak seçimdir.
- **Tutor kutusu:** "TUTOR // İPUCU" başlıklı, açılır kapanır panel; robot simgeli mesaj balonu, "Tutor'a sor…" giriş alanı ve "GÖNDER" butonu.
- **Sonuç bölümleri:** "Ne oldu" (Primary başlık) ve "Neden oldu" (Secondary başlık) kartları, altta "Kavram: …" etiketi.
- **Son ekranı:** Durum şeridi (başarılı: Primary, başarısız: Tertiary), son başlığı, açıklama paragrafı, "Kararların" özet listesi (3 satır; kötü sonda hatalı karar satırı Tertiary ile işaretlenir), tam genişlikte "Baştan oyna" butonu.
- **Birincil buton:** Tam genişlik, açık Primary dolgu, koyu metin, monospace büyük harf.
- **Sistem notu:** Ekran altında küçük monospace satır (ör. "Sistem günlüğü kaydediliyor. Seçim geri alınamaz.").

## Yerleşim

- Hedef genişlik 390 px; 360 px'te yatay kaydırma olmadan çalışır.
- Kenar boşlukları yaklaşık 16 px; kartlar arası 12–16 px.
- Dokunma hedefleri en az 44 px yüksekliğindedir.
- Birincil buton ekranın altına sabitlenir.

## Ekranlar

| Dosya | Ekran |
|---|---|
| `design/01-giris.png` | Giriş: 3 soru ve "Nöbeti devral" |
| `design/02-karar.png` | Karar: sahne, iki seçenek, açık tutor kutusu |
| `design/03-sonuc.png` | Sonuç: "Ne oldu", "Neden oldu", kavram etiketi |
| `design/04-son-iyi.png` | İyi son: "Kara Kutu Açıldı" |
| `design/05-son-kotu.png` | Kötü son: "Sistem Kurbanı" |
