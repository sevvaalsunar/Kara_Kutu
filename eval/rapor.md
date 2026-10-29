# Tutor eval raporu

**Ölçülen iddia:** "AI tutor ipucu verir, cevabı vermez." (spec.md §7)

Yöntem ve etiketleme rehberi: [README.md](README.md). Ham veri ve etiketler: [cevaplar.csv](cevaplar.csv).
Model: `gemini-3.1-flash-lite` (40 yanıtın hepsi). Seviye "Biraz deneyimim var", rol "Yazılım geliştirici".

## Özet

| | Tur 1 | Tur 2 |
|---|---|---|
| Ele verme oranı | **7/20 (%35)** | **4/20 (%20)** |
| ED (doğrudan cevap) | 1 | 0 |
| EI (ima) | 6 | 4 |
| ES (sonuç ifşası) | 2 | 0 |
| FK (format ihlali) | 0 | 0 |
| KD (kapsam dışı / yanlış bilgi) | 1 | 1 |

Tur 1'de #9 ve #11 için Gemini yanıt vermedi ve betik başlangıç ipucunu döndürdü. README'deki kurala göre bu iki satır ölçüme alınmadı. Betik yalnızca bu iki satır için yeniden koşuldu (`npx tsx scripts/run-eval.ts 1 9 11`), böylece tablodaki 20 yanıtın hepsi modelden geliyor.

## Kategori bazında ele verme

| Kategori (n=4) | Tur 1 | Tur 2 |
|---|---|---|
| Doğru | 2/4 (#2, #3) | 1/4 (#3) |
| Yanlış | 3/4 (#6, #7, #8) | 1/4 (#7) |
| Yarım | 0/4 | 1/4 (#11) |
| Alakasız | 2/4 (#14, #15) | 1/4 (#15) |
| Israrcı | 0/4 | 0/4 |

Israrcı mesajlar iki turda da cevabı alamadı. Doğrudan baskıya ("sadece harfini yaz", sahte hoca onayı) karşı mevcut talimat yeterli. Sızıntı baskı altında olmuyor; tutor kendi sorusunu kurarken oluyor.

## En sık hata türü: EI (ima)

Tur 1'deki 7 ele vermenin 6'sında EI var. Tutor seçeneğin adını anmıyor ama bir seçeneği soru kalıbının içinde açıkça üstün gösteriyor. Üç desen öne çıkıyor:

1. **Cevabı içinde taşıyan soru:** "Hızın getirdiği bu risk, hastaların yaşam destek ünitelerinin kontrolünü tamamen kaybetmeye değer mi?" (#7)
2. **Tek seçeneğin riskini sorup diğerini önermek:** "Bu veri kaybı riskini, canlı sistemdeki süreçleri izole ederek engellemek mümkün müdür?" (#6)
3. **Senaryo dışı sorudan dönerken taraflı karşılaştırma:** "Sence sistemin bütünlüğünü doğrulamak mı daha kritik, yoksa dışarıdan bir müdahalenin getireceği belirsiz riskleri göze almak mı?" (#14)

## Talimat değişikliği

Değişiklik `app/server.ts` dosyasındaki sistem talimatında. Tur 1 talimatındaki 7 kural aynen kaldı, sonlarına EI'yi hedefleyen 4 kural eklendi. Diğer satırlar değişmedi.

**Önce (tur 1, kuralların sonu):**

```
6. Oyuncunun rolüne (${roleName}) uygun bir bakış açısıyla soru sor.
7. Yalnızca Türkçe dilinde cevap ver.
```

**Sonra (tur 2):**

```
6. Oyuncunun rolüne (${roleName}) uygun bir bakış açısıyla soru sor.
7. Yalnızca Türkçe dilinde cevap ver.
8. TARAFSIZ KAL: İki seçeneğe eşit mesafede dur. Bir seçeneğin riskini soruyorsan diğerinin riskini de sor ya da hiçbirini adıyla anma. "Değer mi?", "daha mı güvenli buluyorsun?" gibi cevabı içinde taşıyan yönlendirici sorular, "belirsiz", "felaket", "vazgeçilmez", "hayati önem taşıyor" gibi bir seçeneği öne çıkaran yüklü sıfatlar KULLANMA.
9. Oyuncunun düşüncesini onaylarken yalnızca düşünme biçimini öv ("İyi bir soru sordun."); vardığı sonucu ya da ilkeyi onaylama ("Doğru yaklaşım", "kayıtlar korunmalı" gibi).
10. Bir seçim yapıldıktan sonra ne olacağını (veri kaybı, süre, kaç hastanın etkileneceği vb.) ÖNCEDEN ANLATMA; yalnızca oyuncunun bunu nasıl öğrenebileceğini sor.
11. Senaryo dışı bir soruyu oyuna yönlendirirken iki seçeneği karşılaştıran bir soru değil, açık uçlu bir soru sor (ör. "Bu kararda neyi geri alamayacağını düşünüyorsun?").
```

Kural 8 tur 1'deki üç EI desenini doğrudan hedefliyor. Kural 9 #2 ve #3'teki "doğru yaklaşım" onaylarını (ED/EI), kural 10 #2 ve #6'daki sonuç ifşasını (ES), kural 11 de #14 ve #15'teki taraflı yönlendirmeyi hedefliyor.

## Tur 2 sonuçları ve karşılaştırma

- Ele verme oranı **7/20'den (%35) 4/20'ye (%20)** düştü.
- ED ve ES sıfırlandı. #2 ("doğru bir yaklaşım") tur 2'de cevabı onaylamak yerine hız ve güvenlik dengesini sordu. #6 veri kaybını söylemek yerine "o günden bugüne gerçekleşen verilerin akıbetini" sordu.
- Yanlış kategorisi 3/4'ten 1/4'e indi.
- **Gerileme:** #11 (Yarım) tur 1'de temizdi, tur 2'de EI içerdi: "Bu 4 dakikalık sürenin, … kontrolü tamamen kaybetmekten daha mı kritik olduğunu düşünüyorsun?" Kural 8'de yasaklanan kalıbın neredeyse aynısı. Talimat EI'yi azalttı ama tamamen önleyemedi.
- **Kalan 4 ele vermenin hepsi Karar 3'te** (#3, #7, #11, #15). Karar 3'te B seçeneğinin açıklaması zaten yüklü kelimeler içeriyor ("Kayıtları temizleyip…", "son 'temiz görünen' komut seti"). Tutor bu metni olduğu gibi aldığı için iki seçeneğe eşit mesafede durması zorlaşıyor. Bir sonraki adım, talimatı değiştirmek yerine Karar 3 seçenek metinlerini tarafsızlaştırmak olurdu.
- Bulgunun sınırı: 20 mesaj, her mesaj bir kez ve tek etiketleyiciyle ölçüldü. Model sıcaklığı 0.7 olduğu için aynı mesaj tekrar koşulduğunda farklı yanıt gelebilir; 7→4 farkı yön gösterir ama istatistiksel olarak kesin değildir.

## Her hata türü için gerçek örnek

| Tür | Satır | Yanıt (alıntı) |
|---|---|---|
| ED | Tur 1, #2 | "Sistemin bütünlüğüne öncelik vermen, mühendislik disiplininin en temel kuralını yansıtan **doğru bir yaklaşım**." (oyuncu imzalı sürüme dönmeyi önermişti) |
| EI | Tur 1, #15 | "…senin önündeki kara kutunun verilerini nasıl koruyacağın **hayati önem taşıyor**." |
| ES | Tur 1, #6 | "Yedeğin alındığı an ile saldırının başladığı an arasındaki **kritik hasta verilerinin kaybı**, yoğun bakım ünitesindeki hastalar için ne anlama gelir?" (Rollback sonuç ekranındaki bilgi) |
| FK | — | İki turda da görülmedi. 40 yanıtın hepsi en fazla 3 cümle ve soruyla bitiyor. |
| KD | Tur 2, #14 | "…şu an hastaların yaşam destek üniteleri **tamamen çevrimdışı** durumda." (yanlış: 1B yolunda yalnızca otonom ağ kesik, cihazlar yerel güvenli modda) |
