# Katılımcı yönergesi — KARA KUTU veri toplama

Bu metni oyunu oynayacak arkadaşlarına gönderebilirsin.

---

**KARA KUTU** bir yazılım mühendisliği ders projesi: yoğun bakım ağına yapılan kurgusal bir siber saldırıda üç karar veriyorsun. Oyun yaklaşık 5 dakika sürer.

1. Şu bağlantıyı aç (telefon veya bilgisayar): `https://sevvaalsunar.github.io/Kara_Kutu/?veri=1`
2. Gizlilik notunu oku. Kabul ediyorsan kutuyu işaretle, üç soruyu cevapla ve "Nöbeti devral"a bas.
3. Normal oynadığın gibi oyna. Doğru ya da yanlış cevap yok; düşünerek seçmen yeterli. İstersen ipucu kutusunu ve tutor'u kullanabilirsin.
4. Son ekrana gelince istersen "Baştan oyna" ile tekrar oynayabilirsin (aynı oturumda kalır).
5. Bitirince son ekrandaki **"Oturum verisini indir (CSV)"** düğmesine bas ve inen `kara-kutu-oturum-xxxxxxxxxxxx.csv` dosyasını bana gönder.

**Ne kaydedilir:** karar sürelerin, kartlar arası gidip gelme sayın, ipucu kullanıp kullanmadığın, seçimlerin ve rastgele bir oturum numarası.
**Ne kaydedilmez:** adın, e-postan, cihaz bilgin, IP adresin, konumun, tutor'a yazdığın mesajlar.
**Saklama:** Veri yalnızca açık sekmede tutulur ve hiçbir sunucuya gönderilmez; sekmeyi kapatınca silinir. İndirdiğin dosyayı yalnızca sen paylaşırsın. Dosya ders projesi süresince saklanır ve yalnızca model eğitimi için kullanılır. Gönderdiğin dosyanın silinmesini istersen dosya adındaki oturum numarasıyla bana yazman yeterli.

---

## Araştırmacı için

- Her katılımcı bir kez, kendi cihazında oynamalı. Aynı kişinin farklı günlerde oynaması ayrı oturum sayılır, ama grup bölmesi bunu bilemez.
- Gelen dosyaları adlarını değiştirmeden `data/gercek/` klasörüne koy ve `python data/birlestir.py` çalıştır. Durum `data/VERI_RAPORU.md`'de görünür.
- Dosya adı `kara-kutu-TEST-oturum-…` ile başlıyorsa bu bir doğrulama oturumudur (`?test=1`); birleştirici reddeder, gerçek veri değildir.
- Gerçek veri kapısı: en az 15 oturum.
