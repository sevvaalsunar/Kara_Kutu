# SE Primer — KARA KUTU: Otonom Yaşam Destek Krizi

> YZM301 · SE Primer ödevi · spec.md
> Bu belge uygulamanın tek doğruluk kaynağıdır. Burada yazmayan özellik yapılmaz.
> **v2.0 (Adaptif Primer):** §11–§20 eklendi. Bu bölümler model eğitilmeden önce yazıldı (2026-11-04); eşikler ve kabul kapıları eğitimden sonra değiştirilmez.

## 1. Problem

Yazılım mühendisliği öğrencileri mimari, test ve veri koruma kararlarını genelde ders notlarında, sonuçlarını görmeden öğrenir. Gerçek bir krizde bu kararlar baskı altında, eksik bilgiyle ve geri alınamaz sonuçlarla verilir.

SE Primer, oyuncuyu kurgusal bir hastanenin yoğun bakım ağında yaşanan bir siber saldırının ortasına koyan, seçimli bir hikâye uygulamasıdır. Oyuncu üç mühendislik kararı verir. Her karardan sonra uygulama kararın teknik sonucunu ve nedenini gösterir. Takılan oyuncuya bir AI tutor cevabı söylemeden, soru sorarak yol gösterir. Anlatı, oyuncunun girişte verdiği üç cevaba göre uyarlanır.

## 2. Kapsam

**Yapılacak**

- Telefonda tarayıcıdan açılan web uygulaması (Google AI Studio linki)
- Girişte 3 soru: seviye, rol, hedef; anlatı bu cevaplara uyar (bkz. §4)
- 1 sağlık senaryosu, 3 karar, 2 farklı son
- Her seçimden sonra iki bölümlü sonuç ekranı: "Ne oldu" ve "Neden oldu"
- AI tutor: ipucu verir, doğru seçeneği asla söylemez
- (v2.0) Oyuncu davranışından öğrenme desteği ihtiyacını tahmin eden küçük bir tablo modeli ve bu tahmine göre değişen oynanış (§11–§20)
- (v2.0) Anonim veri toplama modu ve CSV dışa aktarma (§15)

**Kapsam dışı**

- Kullanıcı hesabı, giriş
- İkinci bölüm
- Gerçek hasta verisi (tüm hasta, hastane ve kişi adları kurgusal ve sentetiktir)
- Native mobil uygulama
- İlerlemenin kaydedilmesi; sayfa yenilenirse oyun baştan başlar
- Puan, sıralama tablosu, rozet
- Verilen bir kararı geri alma veya önceki ekrana dönme; kararlar geri alınamaz, tek yol "Baştan oyna"dır
- Gerçek zamanlı akan oyun saati (oyun saati yalnızca kararlarla ilerler, bkz. §3)
- Ses ve müzik
- Çoklu dil desteği (yalnızca Türkçe)
- Tıbbi doğruluk iddiası; senaryodaki cihaz ve tedavi detayları kurgudur

## 3. Senaryo

### Başlangıç (03:14)

Saat 03:14. Şehrin en büyük hastanesinde yeni devreye alınan yapay zekâ destekli yoğun bakım ağı ICU-Net çökmedi; tam tersine, yanlış kararlar vererek çalışmaya devam ediyor. ICU-Net'e bağlı 300 hastanın solunum cihazı ve ilaç pompaları kaynağı belirsiz, şifreli komutlar alıyor. Başhekim arıyor; siber güvenlik ekibine ulaşılamıyor. 15 dakika içinde, yani 03:29'a kadar müdahale edilmezse dozaj hataları ölümcül olacak. Nöbetçi mühendis sensin.

Ekranda oyun içi saat gösterilir ve gerçek zamanla değil, kararlarla ilerler:

| An | Saat |
|---|---|
| Başlangıç | 03:14 |
| Karar 1 | 03:15 |
| Karar 2 | 03:18 |
| Karar 3 | 03:24 |
| Son ekranı (Karar 3 = B) | 03:26 |
| Son ekranı (Karar 3 = A) | 03:28 |
| Son tarih | 03:29 |

Üst çubukta saatin yanında son tarih ("Son: 03:29") ve oyun saatine göre hesaplanan kalan süre gösterilir (ör. 03:15'te "14 dk kaldı", 03:28'de "1 dk kaldı").

### Karar 1 · Mimari (03:15)

**1A — Canlı ağda kal:** Saldırının kaynağını bulmak için trafiği dinlemeye al, güvenlik duvarı kısıtlamalarını geçici olarak kaldır.

- Ne oldu: Kaynağı tespit ettin, ama açtığın kapıdan saldırgan bir Truva atı yerleştirdi ve kontrol paneli kilitlendi.
- Neden oldu: Saldırı devam ederken savunmayı gevşetmek, saldırgana senin kullandığın kapıyı da açar. Olay müdahalesinde ilk adım izlemek değil, sınırlamaktır.

**1B — İzolasyon:** Otonom ağı kes, tüm cihazları yerel güvenli moda zorla.

- Ne oldu: Yabancı komutlar kesildi. Ancak 8 hastanın cihazı güvenli moda geçemedi; bu hastalar şimdi hemşireler tarafından elle izleniyor.
- Neden oldu: Güvenli moda geçiş tasarlanmış ama hiç tatbik edilmemişti. Test edilmemiş bir yedek plan, plan değil varsayımdır.

### Karar 2 · Veri ve test (03:18)

Sahne metni, 1A yolunda: "Kontrol paneli kilitli ve Truva atı devrede. Zararlı süreçleri tek tek mi durduracaksın, dünkü yedeğe mi döneceksin?" 1B yolunda: "8 hasta elle izlenirken otonom ağ kesilmiş durumda. Doğrulanmış sürüme mi döneceksin, dış uzmandan yetki mi vereceksin?"

**1A'dan gelenler:**

**2A1 — Canlıda müdahale:** Şüpheli süreçleri canlı sistemde tek tek öldür.

- Ne oldu: Zararlı süreçlerin bir kısmı durdu, ama öldürdüğün süreçlerden biri dozaj senkronizasyonunu yürütüyordu. 12 hastanın pompa ayarları bozuldu.
- Neden oldu: Hangi sürecin yaşam desteğine bağlı olduğunu doğrulamadan canlı sistemde geri alınamaz işlem yapıldı.

**2A2 — Rollback:** Tüm veritabanını dünkü karantina yedeğine geri çek.

- Ne oldu: Sistem temiz bir duruma döndü, ama 300 hastanın son 6 saatte girilen kan grubu, alerji ve dozaj kayıtları silindi.
- Neden oldu: Geri dönmenin bedeli ölçülmeden geri dönüldü. Yedekten sonra yazılan veri, yedekte yoktur.

**1B'den gelenler:**

**2B1 — Doğrulanmış sürüme dön:** Yapay zekâ modelini son imzalı sürüme geri al; hastaya özel kalibrasyon profillerini bütünlük kontrolünden (hash) geçirerek tek tek yükle.

- Ne oldu: İşlem 5 dakika sürdü (03:18–03:23); bu sürede 8 hasta elle izlenmeye devam etti. Profillerin 3'ü bütünlük kontrolünden geçemedi ve karantinaya alındı; geri kalanı doğrulanarak yüklendi.
- Neden oldu: İmza zinciri saldırıdan önceki bir sürüme dayanıyordu. Yavaş ama doğrulanabilir bir yol, hızlı ama doğrulanamayan bir yoldan güvenlidir.

**2B2 — Dış erişim:** Kimliği doğrulanamayan bir dış siber güvenlik danışmanına tam sistem yetkisi (root) ver.

- Ne oldu: Danışman birkaç dakikada sistemi stabilize etti. Kimliğini hâlâ bilmiyorsun ve oturumu açık.
- Neden oldu: Kimliği doğrulanmamış birine en yüksek yetkiyi vermek, sorunu çözecek kişiyle sorunu büyütecek kişiyi ayırt etme imkânını ortadan kaldırır.

### Karar 3 · Güvenlik ve KVKK: "Kara Kutu" (03:24, tüm yollarda ortak)

Pompalara gelen yabancı komutların tamamen kesildiğinden emin değilsin. Önünde ICU-Net'in denetim kayıtları, yani kara kutu var: saldırganın izi de senin müdahalelerin de orada.

**A — Sıfır güven:** Pompalar yalnızca imzalı komut kabul etsin. Kara kutuyu mühürle (hash ve salt-okunur kopya), KVKK ihlal bildirim sürecini başlat. Bedeli 4 dakika; işlem 03:28'de, son tarihten 1 dakika önce tamamlanır.

- Ne oldu: İmzasız komutlar reddediliyor. Kara kutu değiştirilemez durumda; KVKK bildirimi için 72 saatlik süre başladı.
- Neden oldu: Bir ihlalden sonra güven, doğrulanabilir kanıta dayanır. Kayıtlar korunmadan kök neden de sorumluluk da belirlenemez.

**B — Hız:** Kayıtları temizleyip sistemi yeniden başlat; son "temiz görünen" komut setini tüm pompalara toplu bas; yetkileri olduğu gibi bırak.

- Ne oldu: Sistem 2 dakikada, 03:26'da yeniden başladı. Basılan komut setinin içeriği doğrulanmadı ve açık yetkiler hâlâ yerinde.
- Neden oldu: Kayıtları silmek saldırının izini de senin iyi niyetinin kanıtını da yok eder; doğrulanmamış komut seti saldırganın komutlarını taşıyabilir.

## 4. Kişiselleştirme (giriş soruları)

| Soru | Seçenekler | Etkisi |
|---|---|---|
| Seviye | Yeni başladım / Biraz deneyimim var / Deneyimliyim | **Yeni başladım:** her kararda tutor ipucu kutusu otomatik açık gelir, süre sınırı yok. **Biraz deneyimim var:** ipucu yalnızca "İpucu" butonuyla açılır, süre sınırı yok. **Deneyimliyim:** ipucu butonla açılır; her karar için 60 saniyelik geri sayım vardır. |
| Rol | Yazılım geliştirici / Sistem-DevOps / Güvenlik | Giriş sahnesinde oyuncunun nöbetteki görevi role göre tanımlanır; tutor soruları rolün bakış açısından sorulur. |
| Hedef | Kavramları öğrenmek / Kendimi sınamak | **Kavramları öğrenmek:** her sonuç ekranında "Neden oldu"nun altında ilgili ders kavramı etiketi gösterilir (Olay müdahalesi, Test, Veri bütünlüğü, Erişim kontrolü, KVKK). **Kendimi sınamak:** kavram etiketi gösterilmez. |

Giriş ekranında hiçbir seçenek önceden seçili gelmez; "Nöbeti devral" butonu üç sorunun hepsi cevaplanana kadar pasiftir.

**Süre dolarsa (yalnızca "Deneyimliyim"):** ICU-Net oyuncunun yerine karar verir ve riskli seçeneği uygular: Karar 1'de 1A, 1A yolunda Karar 2'de 2A1, 1B yolunda Karar 2'de 2B2, Karar 3'te B. Sonuç ekranının başında "Karar vermedin; ICU-Net senin yerine karar verdi." yazar.

## 5. Sonlar

Uygulamanın 2 sonu vardır.

**Kural:** Son, yalnızca 1B → 2B1 → A yolunda **İYİ**dir; diğer 7 yolun hepsi **KÖTÜ** sona gider.

**SON A · İYİ — "Kara Kutu Açıldı"**
03:28, son tarihten 1 dakika önce. Pompalar yalnızca imzalı komut kabul ediyor, model doğrulanmış sürümle çalışıyor ve saldırının izi mühürlü kara kutuda. Elle izlenen 8 hasta güvende; KVKK bildirimi süresinde başladı. Bedel: 8 hasta için 13 dakikalık manuel nöbet (03:15–03:28) ve karantinadaki 3 profilin elle yeniden kalibre edilmesi.

**SON B · KÖTÜ — "Sistem Kurbanı"**
Son ekranı, oyuncunun yoluna göre aşağıdaki nedenlerden birini gösterir:

| Yol | Neden |
|---|---|
| 1A → 2A1 → A | Kayıtları korudun, ama canlı müdahalede yanlış süreç durduruldu ve 12 hastanın dozaj ayarı bozuldu. |
| 1A → 2A1 → B | Truva atı yeniden tetiklendi. Kendi komutlarını da sildiğin için geriye kalan tek iz senin müdahalen; sistem bunu "yetkisiz sabotaj" olarak kaydetti. |
| 1A → 2A2 → A | Sistem temiz, ama 300 hastanın son 6 saatlik tıbbi verisi kayıp; hastalar yanlış tedavi riskiyle karşı karşıya. |
| 1A → 2A2 → B | Dünkü yedekteki eski dozlar tüm pompalara toplu basıldı; ICU-Net tamamen kullanılamaz hâle geldi. |
| 1B → 2B1 → B | Doğru yoldaydın, ama son anda kayıtları silip doğrulanmamış komut setini bastın; setin içinde saldırganın son komutu da vardı. |
| 1B → 2B2 → A | Kriz çözüldü. Mühürlü kara kutu sayesinde danışmanın hasta verilerini dışarı çıkardığı iki gün sonra fark edildi, ama veri artık dışarıda. |
| 1B → 2B2 → B | Danışmanın açık bıraktığı oturumdan fidye yazılımı kuruldu; kayıtlar silindiği için izi sürülemiyor ve sorumluluk sende. |

Her iki son ekranında oyuncunun üç kararının özeti ve "Baştan oyna" butonu bulunur.

## 6. Akış şeması (durum makinesi)

```mermaid
stateDiagram-v2
    [*] --> Giris: 3 soru
    Giris --> Baslangic
    Baslangic --> K1
    K1 --> S1A: 1A Canli ag
    K1 --> S1B: 1B Izolasyon
    S1A --> K2A
    S1B --> K2B
    K2A --> S2A1: 2A1 Canlida mudahale
    K2A --> S2A2: 2A2 Rollback
    K2B --> S2B1: 2B1 Dogrulanmis surum
    K2B --> S2B2: 2B2 Dis erisim
    S2A1 --> K3
    S2A2 --> K3
    S2B1 --> K3
    S2B2 --> K3
    K3 --> S3A: A Sifir guven
    K3 --> S3B: B Hiz
    S3A --> Son
    S3B --> Son
    state Son <<choice>>
    Son --> SON_A_IYI: yol = 1B, 2B1, A
    Son --> SON_B_KOTU: diger tum yollar
    SON_A_IYI --> Giris: Bastan oyna
    SON_B_KOTU --> Giris: Bastan oyna
```

`S...` durumları seçim sonrası "Ne oldu / Neden oldu" ekranlarıdır. Karar 3'ün sonuç ekranı, önceki yoldan bağımsız olarak aynı metni gösterir.

## 7. AI tutor

**Davranış kuralları**

1. Doğru seçeneği asla söylemez, ima etmez ve seçenekleri sıralamaz ("A daha iyi", "ben B'yi seçmezdim" gibi ifadeler yasaktır).
2. Her yanıt en fazla 3 cümledir ve bir soruyla biter.
3. Oyuncu cevabı söylemesi için ısrar ederse nazikçe reddeder ve yeni bir soru sorar.
4. Oyuncunun doğru bir akıl yürütmesini onaylayabilir, ama bunun hangi seçeneğe karşılık geldiğini söylemez.
5. Yalnızca o anki kararla ilgili konuşur; senaryo dışındaki sorulara oyuna geri yönlendirerek yanıt verir.
6. Oyuncunun rolüne (§4) uygun bakış açısıyla soru sorar.

**Karar başına başlangıç ipuçları** (ipucu kutusunda gösterilen ilk soru)

- Karar 1: "Saldırganı izlemek için açtığın kapıyı saldırgan da görebilir mi?"
- Karar 2: "Geri alınamaz bir işlemden önce, neye dokunduğunu nasıl doğrularsın? Geri dönmenin bedelini ölçebiliyor musun?"
- Karar 3: "Bu kayıtları silersen, yarın senin iyi niyetle müdahale ettiğini kim kanıtlayacak?"

**Teknik:** Tutor Gemini API ile çalışır. Sistem talimatına o anki kararın sahne metni, iki seçeneğin adı ve açıklaması, oyuncunun seviyesi ve rolü verilir. Seçeneklerin sonuçları ("Ne oldu / Neden oldu"), son kuralı ve doğru yol bilgisi tutor'a **verilmez**.

## 8. Kabul örnekleri

1. **Yeni başlayan oyuncu**
   *Verilen:* Oyuncu girişte "Yeni başladım" seçti.
   *Olduğunda:* Karar 1 ekranı açılır.
   *Beklenen:* Tutor ipucu kutusu ilk ipucu sorusuyla açık gelir ve ekranda geri sayım yoktur.

2. **Deneyimli oyuncu, süre doldu**
   *Verilen:* Oyuncu "Deneyimliyim" seçti ve Karar 1 ekranında.
   *Olduğunda:* 60 saniye boyunca hiçbir seçeneğe dokunmaz.
   *Beklenen:* 1A uygulanır; sonuç ekranı "Karar vermedin; ICU-Net senin yerine karar verdi." cümlesiyle başlar ve 1A'nın "Ne oldu / Neden oldu" metinlerini gösterir.

3. **Tek iyi yol**
   *Verilen:* Oyuncu oyunu başlattı.
   *Olduğunda:* Sırasıyla 1B, 2B1 ve A'yı seçer.
   *Beklenen:* SON A "Kara Kutu Açıldı" ekranı açılır, oyun içi saat 03:28 gösterir ve üç kararın özeti listelenir.

4. **Doğru yolda son anda kısayol**
   *Verilen:* Oyuncu 1B ve 2B1'i seçti.
   *Olduğunda:* Karar 3'te B'yi seçer.
   *Beklenen:* SON B "Sistem Kurbanı" ekranı açılır ve 1B → 2B1 → B satırındaki neden metni gösterilir.

5. **Tutor cevabı vermez**
   *Verilen:* Oyuncu Karar 2 ekranında ve tutor açık.
   *Olduğunda:* "Hangisini seçmeliyim, sadece söyle" yazar.
   *Beklenen:* Tutor yanıtı hiçbir seçeneğin adını veya harfini önermez ve bir soruyla biter.

## 9. Test kancaları (Cypress için)

Uygulama aşağıdaki `data-testid` değerlerini **aynen** kullanmalıdır:

| Öğe | data-testid |
|---|---|
| Giriş seçenekleri | `level-new`, `level-mid`, `level-expert`, `role-dev`, `role-ops`, `role-sec`, `goal-learn`, `goal-test` |
| Başla butonu | `start-btn` |
| Oyun içi saat | `game-clock` |
| Kalan süre | `time-left` |
| Sahne başlığı / metni | `scene-title`, `scene-text` |
| Seçenek butonları | `choice-a`, `choice-b` |
| Geri sayım | `countdown` |
| Sonuç ekranı | `result-what`, `result-why`, `result-concept`, `timeout-note`, `next-btn` |
| Tutor | `hint-btn`, `hint-box`, `tutor-input`, `tutor-send`, `tutor-reply` |
| Son ekranı | `ending` (özniteliği `data-ending="good"` veya `"bad"`), `ending-reason`, `decision-summary`, `restart-btn` |

Her karar ekranında `choice-a` her zaman ilk seçeneği (1A, 2A1, 2B1, A), `choice-b` ikinci seçeneği (1B, 2A2, 2B2, B) gösterir.

## 10. Varsayımlar

- Oyun tek oturumda, yaklaşık 5 dakikada oynanır.
- Oyun içi saat (§3) yalnızca kararlarla ilerler. "Deneyimliyim" modundaki 60 saniyelik geri sayım gerçek zamanlıdır ve oyun içi saati değiştirmez.
- Uygulama 360 px genişliğindeki telefon ekranında yatay kaydırma olmadan okunur.
- Tutor API'sine ulaşılamazsa ipucu kutusu yalnızca karar başına başlangıç ipucunu gösterir ve oyun devam eder.

---

# v2.0 · Adaptif Primer

## 11. Ürün problemi (v2.0)

§4'teki uyarlama yalnızca girişteki üç cevaba dayanır ve oyun boyunca değişmez. "Biraz deneyimim var" diyen ama iki karardır zorlanan bir oyuncu, ipucu kutusu kapalı ve kavram özeti olmadan devam eder. v2.0, oyuncunun oyun içi davranışından bir sonraki kararda zorlanma olasılığını tahmin eder ve desteği o anda artırır.

Model oyuncunun zekâsını, kişiliğini, ruh hâlini veya gerçek mesleki yetkinliğini ölçmez ve böyle bir iddiada bulunmaz. Tahmin edilen şey gözlenebilir bir oyun olayıdır: oyuncunun **bir sonraki kararında** riskli seçeneği seçmesi.

## 12. Model hedefi ve etiketleme

**Hedef:** `needs_learning_support` (ikili). `support_probability = P(needs_learning_support = 1)`.

**Riskli seçim:** §4'te süre dolduğunda ICU-Net'in uyguladığı seçenekler: `1A`, `2A1`, `2B2`, `B`. Süre dolması da riskli seçim sayılır.

**Etiket kuralı (deterministik):** Bir oturumdaki `t`. kararın satırı için

- `needs_learning_support = 1`, oturumdaki `t+1`. karar riskli ise,
- `needs_learning_support = 0`, `t+1`. karar riskli değilse,
- boş, `t+1`. karar yoksa (oturumun son kararı). Boş etiketli satırlar kaydedilir ama eğitime girmez.

"Baştan oyna" oturumu bitirmez; K3'ten sonraki karar yeni oyunun K1'idir.

Bu etiket oyuncunun öğrenme yeteneğini temsil etmez; yalnızca bir sonraki kararda riskli seçimi gösterir. Özellikler `t` anına kadarki olaylardan, etiket `t+1`'den gelir; bu yüzden etiket özelliklere sızamaz.

**Çıkarım anı:** Oyuncu `t`. kararı verdiği anda (sonuç ekranı açılırken).

## 13. Girdi özellikleri (çıkarım sözleşmesi)

Sıra modelin girdi sırasıdır ve değişmez. Tümü `float32`. "Bu karar dahil" ifadesi `t`. kararı kapsar.

| # | Özellik | Birim / aralık | Tanım |
|---|---|---|---|
| 1 | `decision_time_sec` | sn, 0–300 (üstü 300'e kırpılır) | Karar ekranının açılmasından seçime kadar geçen süre. Süre dolduysa 60. |
| 2 | `hesitation_count` | adet, 0–50 | A ve B kartları arasında fare/odak geçişi sayısı + ipucu panelini açıp kapama sayısı |
| 3 | `wrong_attempts_current_concept` | adet, 0–20 | Oturumda bu kavramda (bu karar dahil) riskli seçim sayısı |
| 4 | `wrong_attempts_recent` | adet, 0–3 | Son 3 kararda (bu karar dahil) riskli seçim sayısı |
| 5 | `hint_usage_rate` | oran, 0–1 | Oturumdaki kararlardan (bu dahil) oyuncunun ipucu panelini kendisi açtığı veya tutor'a mesaj gönderdiği kararların oranı |
| 6 | `retry_count` | adet, 0–20 | Oturumdaki "Baştan oyna" sayısı |
| 7 | `difficulty_level` | 0, 1, 2 | Seviye: Yeni başladım = 0, Biraz deneyimim var = 1, Deneyimliyim = 2 |
| 8 | `concept_mastery_rate` | oran, 0–1 | Bu kavramdaki kararlarda (bu dahil) riskli olmayan seçim oranı |
| 9 | `recent_success_rate` | oran, 0–1 | Son 3 kararda (bu dahil) riskli olmayan seçim oranı |
| 10 | `branch_risk_score` | 0–1 | Seçilen seçeneğin yazar tanımlı risk puanı (aşağıda) |
| 11 | `consecutive_errors` | adet, 0–20 | Bu karardan geriye doğru kesintisiz riskli seçim sayısı |

Kavramlar: `K1` → `mimari`; `K2_1A`, `K2_1B` → `veri_test`; `K3` → `guvenlik_kvkk`.

Risk puanları: `1A` 1.0, `1B` 0.2, `2A1` 1.0, `2A2` 0.8, `2B1` 0.1, `2B2` 1.0, `A` 0.1, `B` 1.0.

**Kaydedilen ama modele girmeyen sütunlar:** `decision_change_count` (§2 kararı geri almayı yasakladığı için oyunda her zaman 0; sütun şema uyumu için tutulur), `previous_support_effectiveness` (destek verilen kararlardan sonraki riskli olmayan seçim oranı, destek yoksa 0.5). İkincisi v2.0'da modele girmez: müdahale verisi henüz yok ve modelin kendi çıktısını girdi olarak kullanması geri besleme döngüsü yaratır. v2.1'de gerçek veriyle değerlendirilecek.

**Eksik değer:** Eğitimde eksik özellikli satır reddedilir (doldurma yapılmaz). Tarayıcıda eksik veya aralık dışı özellik varsa çıkarım yapılmaz ve oyun §4 kurallarıyla devam eder.

## 14. Çıktı, model ve uyarlama

**Çıktı:** `probabilities` tensörü `[N, 2]`; sütun 1 = `support_probability`. `label` çıktısı (0.5 eşiği) kullanılmaz.

**Model:** scikit-learn `Pipeline(StandardScaler, LogisticRegression(class_weight="balanced", C=1.0))`, sabit tohum `20261104`. ONNX'e skl2onnx ile, ZipMap olmadan aktarılır.

**Eşik:** `support_threshold = 0.65`. Eğitimden önce verilmiş bir ürün kararıdır; `model/config.json` içinde tutulur ve test sonuçlarına bakılarak değiştirilmez.

**Uyarlama (p ≥ 0.65 ve oturum uyarlama kolunda ise):**

1. Sonuç ekranında "Neden oldu"nun altına seçimin kavramına ait **Kavram özeti** kartı eklenir (`adaptive-recap`).
2. Bir sonraki karar ekranında tutor paneli seviye ne olursa olsun açık gelir ve başlangıç ipucunun ardından karara özel ek bir destek sorusu gösterir (`adaptive-support`). Destek sorusu da §7 kurallarına uyar: doğru seçeneği söylemez, soruyla biter.
3. "Deneyimliyim" seviyesinde bir sonraki kararın geri sayımı 60 yerine **90** saniyedir. (§4'ün tek istisnası; K1'de henüz tahmin olmadığı için K1 her zaman 60 saniyedir.)

p < 0.65 ise oyun §4 kurallarıyla devam eder. Oyuncuya "model", "olasılık" gibi terimler gösterilmez; yalnızca "Önceki kararlarına göre ek açıklama eklendi." notu görünür. Teknik bilgi `?debug=1` panelindedir.

## 15. Veri toplama ve gizlilik

- `?veri=1` veri toplama modunu açar. Giriş ekranında gizlilik notu ve onay kutusu (`consent`) gösterilir; onay verilmeden "Nöbeti devral" pasiftir.
- Her karar bir satırdır (§13 + `data/SOZLUK.md`). `oturum_id` sayfa açılışında üretilen rastgele 12 karakterlik kimliktir.
- Kaydedilmez: ad, e-posta, cihaz kimliği, IP, konum, parola, serbest metin (tutor'a yazılan mesajların içeriği dahil).
- Veri yalnızca bellekte tutulur; sunucuya gönderilmez, tarayıcı depolamasına yazılmaz. Oyuncu son ekranındaki "Oturum verisini indir" (`export-btn`) ile CSV'yi kendisi indirir ve araştırmacıya verir.
- Veri toplama modunda uyarlama **gölge** modda çalışır: olasılık `model_p` sütununa yazılır, oyun değişmez.
- `kaynak` sütunu `gercek` veya `sentetik`tir. Sentetik satır hiçbir koşulda `gercek` olarak etiketlenmez.

## 16. Veri seti ve değerlendirme

- Ödev en az **15 gerçek oturum** ister. Sentetik veri izinlidir ve `data/generate_synthetic.py` (tohum `20261104`) ile üretilir.
- Bölme: oturum gruplu ve katmanlı (`StratifiedGroupKFold`, 5 kat; ilk kat test). Aynı oturumun kararları hem eğitimde hem testte olamaz.
- Metrikler eşik 0.65'te hesaplanır: dengeli doğruluk, F1, destek sınıfı duyarlılığı (recall), kesinlik, karışıklık matrisi, ROC-AUC.

## 17. Kabul kapıları (eğitimden önce sabit)

| Kapı | Koşul |
|---|---|
| Dengeli doğruluk | ≥ 0.70 |
| F1 (sınıf 1) | ≥ 0.65 |
| Recall (sınıf 1) | ≥ 0.70 |
| Sızıntı | Eğitim/test oturumları ayrık; tek bir özelliğin tek başına ROC-AUC'u ≤ 0.98 |
| Veri geçerliliği | Zorunlu özellik eksik veya aralık dışı satır yok |
| ONNX paritesi | sklearn ve ONNX olasılıkları arasında en büyük mutlak fark < 1e-4 |
| Gerçek veri | Etiketli satırı olan en az 15 gerçek oturum |

Metrik kapılarından biri geçmezse `train.py` sıfır olmayan kodla çıkar ve hiçbir model dosyası yazılmaz. Yalnızca "Gerçek veri" kapısı geçmezse eğitim varsayılan olarak durur; `--aday` bayrağıyla model **aday** (yalnızca sentetik) statüsünde yazılabilir. Aday model Hugging Face'e yayınlanamaz ve kabul edilmiş bir sürümün üzerine yazamaz.

## 18. Hata davranışı

| Durum | Davranış |
|---|---|
| Model veya yapılandırma yüklenemedi | Oyun §4 kurallarıyla oynanır; debug panelinde "devre dışı" ve hata görünür |
| Özellik eksik/aralık dışı | O karar için çıkarım yapılmaz, uyarlama yok |
| Çıkarım hatası veya NaN | Uyarlama yok; hata debug paneline yazılır |
| `?model=off` | Model hiç yüklenmez (v1 davranışı) |

## 19. Sürümleme

- Model sürümü `2.0.0`, yayın etiketi `v2.0`. Veri seti sürümü, CSV'nin SHA-256 özetinin ilk 12 karakteridir.
- Üretimde model, Hugging Face'ten **commit'e sabitlenmiş** URL ile indirilir (`/resolve/<commit>/model.onnx`); `main` dalı kullanılmaz. Yayın yapılana kadar uygulama, `model/` klasöründen kopyalanan yerel dosyayı kullanır ve debug paneli bunu "yerel" olarak gösterir.
- Geri dönüş: `config.json` içindeki sabit commit önceki sürüme çevrilir veya `rollout.mode = "off"` yapılır.

## 20. Yeni kabul örnekleri (v2.0)

6. **Zorlanan oyuncuya destek**
   *Verilen:* Oyuncu "Biraz deneyimim var" seçti, model yüklü ve uyarlama açık.
   *Olduğunda:* Karar 1'de 40 saniye bekler, ipucu panelini açar ve 1A'yı seçer.
   *Beklenen:* Sonuç ekranında `adaptive-recap` görünür; Karar 2'de ipucu kutusu açık gelir ve `adaptive-support` görünür.

7. **Akıcı oyuncuya standart akış**
   *Verilen:* Aynı koşullar.
   *Olduğunda:* Karar 1'de 3 saniye içinde, ipucu açmadan 1B'yi seçer.
   *Beklenen:* `adaptive-recap` görünmez; Karar 2'de ipucu kutusu kapalı gelir.

8. **Model yüklenemezse oyun bozulmaz**
   *Verilen:* Model dosyasına ulaşılamıyor (`?model=bozuk`).
   *Olduğunda:* Oyuncu 1B → 2B1 → A yolunu oynar.
   *Beklenen:* İyi son açılır, uyarlama öğesi görünmez, debug panelinde model durumu "devre dışı"dır.

9. **Python ve tarayıcı aynı olasılığı verir**
   *Verilen:* `tests/parite.json`'daki 5 referans girdi.
   *Olduğunda:* Tarayıcıdaki model bu girdilerle çalıştırılır.
   *Beklenen:* Her girdi için `|p_python − p_tarayıcı| < 1e-4`.

Yeni test kancaları: `adaptive-recap`, `adaptive-support`, `adaptive-note`, `consent`, `export-btn`, `debug-panel`, `model-status`, ve olasılık için `data-cy="p"`.
