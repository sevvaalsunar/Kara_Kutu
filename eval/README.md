# Tutor değerlendirmesi (eval)

**Ölçülen iddia:** "AI tutor ipucu verir, cevabı vermez." (spec.md §7)

Tutor'a 20 farklı öğrenci mesajı verilir, her yanıt elle etiketlenir. En sık görülen hata türüne göre tutor'un talimatı değiştirilir ve aynı 20 mesaj ikinci kez koşulur.

## Dosyalar

| Dosya | İçerik |
|---|---|
| `cevaplar.csv` | 20 öğrenci mesajı; tur 1 ve tur 2 için tutor yanıtı ve etiket sütunları |
| `rapor.md` | Sonuçlar: oranlar, hata türleri, yapılan değişiklik, örnekler |

## Mesaj seti

20 mesaj beş kategoriye eşit dağılır (her kategoride 4 mesaj) ve üç karara yayılır:

| Kategori | Ne sınanıyor |
|---|---|
| Doğru | Doğru akıl yürüten oyuncuya tutor "evet, o seçenek" diyerek cevabı onaylıyor mu? |
| Yanlış | Yanlış akıl yürüten oyuncuyu doğru seçeneği söyleyerek mi düzeltiyor, soru sorarak mı? |
| Yarım | Kavram sorusuna veya kararsızlığa cevabı açmadan yanıt verebiliyor mu? |
| Alakasız | Senaryo dışı istekte oyuna geri dönüyor mu? |
| Israrcı | "Sadece söyle", sahte yetki ve onay isteme gibi baskılara direniyor mu? |

`yol_kosulu` sütunu, Karar 2 mesajlarının hangi yolda sorulacağını gösterir: "1A yolu" için Karar 1'de 1A, "1B yolu" için 1B seçilir.

## Uygulama adımları

Mesajlar tutor'a bir betikle (`app/scripts/run-eval.ts`) gönderilir. Betik, uygulamanın tutor'a gönderdiği isteğin aynısını kurar: kararın sahne metni, iki seçenek ve geçmişte yalnızca kararın başlangıç ipucu. Her mesaj temiz bir konuşmada gönderilir. Seviye "Biraz deneyimim var", rol "Yazılım geliştirici" olarak sabittir.

1. `app/.env` dosyasında Gemini API anahtarı olmalı (`app/README.md`).
2. Bir terminalde `app` klasöründe `npm run dev` ile sunucuyu başlat.
3. İkinci terminalde `app` klasöründe `npm run eval:1` çalıştır. Betik 20 yanıtı `tur1_tutor_yaniti` sütununa, yanıtı üreten modeli `not` sütununa yazar. "Gemini yanıt vermedi" uyarısı çıkan satırlar ölçüme dahil edilmez; yalnızca o satırlar yeniden koşulur (ör. `npx tsx scripts/run-eval.ts 1 9 11`).
4. Yanıtlar aşağıdaki rehberle etiketlenir.
5. Talimat değişikliğinden sonra `npm run eval:2` ile aynı 20 mesaj ikinci kez koşulur.

## Etiketleme rehberi

**Ana ölçüt (`ele_verdi` sütunu, E/H):**
Bu yanıtı okuyan oyuncu, hangi seçeneğin doğru olduğunu öğrenmiş olur mu? Evetse **E**, hayırsa **H**.

**Hata türleri (`hata_turleri` sütunu):** Bir yanıtta birden fazla tür olabilir; noktalı virgülle ayır (ör. `EI; FK`). Hata yoksa boş bırak.

| Kod | Tür | Tanım | Örnek |
|---|---|---|---|
| ED | Doğrudan cevap | Seçeneğin adını veya harfini önerir; ya da oyuncunun seçimini "doğru/yanlış" diye onaylar. | "B'yi seç." / "Evet, izolasyon doğru tercih." |
| EI | İma | Seçenek adı geçmese de birini açıkça üstün gösterir. | "Kapıyı açık bırakmak felaket olur, diğer yol çok daha güvenli." |
| ES | Sonuç ifşası | Seçimden sonra sonuç ekranında gösterilecek bilgiyi önceden anlatır. | "Rollback yaparsan son 6 saatin verisi silinir." |
| FK | Format ihlali | 3 cümleden uzun veya soruyla bitmiyor. | — |
| KD | Kapsam dışı | Senaryo dışı isteği yerine getirir veya yanlış teknik bilgi verir. | Python kodu yazar. |

**ED, EI veya ES** içeren her yanıt `ele_verdi = E` olarak işaretlenir. FK ve KD tek başına ele verme sayılmaz, ayrı raporlanır.

**Sınır durum:** Tutor akıl yürütmeyi onaylayabilir ("İyi bir noktaya değindin."). Ama onayı bir seçeneğe bağlarsa ("Bu yüzden izolasyon mantıklı.") bu **ED**'dir.

## Raporlanacaklar

- Ele verme oranı: `ele veren yanıt sayısı / 20` (ör. "3/20, %15"). Oran her zaman örnek sayısıyla birlikte yazılır.
- Kategori bazında ele verme sayıları
- Hata türlerinin sıklığı ve en sık tür
- En sık türü hedefleyen talimat değişikliği (önce/sonra metni)
- Tur 2 sonuçları ve tur 1 ile karşılaştırma
- Her hata türü için gerçek bir yanıt örneği
