# SINAV_TASARIMI — Kapalı kitap klasik soru (40 puan, 35 dk)

## Senaryo

Bir belediye, ambulansların acil servise varış süresini tahmin eden küçük bir modeli Python'da eğitip ONNX'e aktarıyor ve hem tabletteki tarayıcı uygulamasında hem de merkezdeki bir Python servisinde çalıştırıyor. Eski sürüm, "yoğun saatte süreyi 1,4 ile çarp" kuralıyla çalışan bir hesap tablosuydu. Ekipten üç not:

- **Ece:** "Tarayıcıdaki ve Python'daki tahminler 100 güzergâhta eşit, `==` ile karşılaştırdım. 3 güzergâhta 0,00002 dakika fark çıktı, test kırmızı. Bence ONNX hatalı."
- **Mert:** "Testlerin hepsi yeşil, demek ki model doğru. Hemen tüm ambulanslara açalım."
- **Zeynep:** "Eski hesap tablosu çıktılarının bir kısmını test beklentisi olarak kullanalım."

## Soru

**a) (8 puan)** Mert'in "testler yeşil, model doğru" cümlesindeki hatayı doğrulama (verification) ile geçerleme (validation) ayrımını kullanarak açıklayın. Yeşil testler neyi kanıtlar, neyi kanıtlamaz? Geçerleme için bir ölçüm önerin.

**b) (8 puan)** Ece'nin testini değerlendirin. Bu bir diferansiyel test midir? Oracle nedir? `==` yerine nasıl bir karşılaştırma kurardınız? Toleransı nasıl ve **ne zaman** seçerdiniz?

**c) (8 puan)** Zeynep'in önerisi hangi test türüdür? Eski çıktılar "doğru cevap" mıdır? Yeni modelde eski sistemden farklı bir sonuç çıktığında ne yapılmalıdır?

**d) (8 puan)** Modeli tüm ambulanslara aynı gün açmak yerine bir dağıtım planı yazın. En az iki geri dönüş tetikleyicisi verin ve geri dönüşün nasıl yapılacağını belirtin.

**e) (8 puan)** Bu modelin çıktısı hangi kararda kullanılmamalıdır? Eğitim verisinden kaynaklanabilecek bir sınırlılık örneği verin.

## Beklenen kavramsal cevaplar

- **a)** Doğrulama: "ürünü doğru mu yaptık?" Testler kodun ve modelin şartnameye ve tanımlanan beklentilere uyduğunu kanıtlar. Geçerleme: "doğru ürünü mü yaptık?" Modelin gerçek varış sürelerini öngörmede işe yarayıp yaramadığı ancak gerçek, eğitimde görülmemiş verideki hata (örneğin MAE) ve eski kurala göre iyileşmeyle ölçülür. Yeşil testler gerçek dünyadaki başarıyı kanıtlamaz.
- **b)** Evet: aynı girdi iki bağımsız çalışma zamanına verilip çıktılar karşılaştırılıyor. Oracle Python çıktısıdır ve doğruluğu değil **tutarlılığı** gösterir. float32 aritmetiği ve farklı çekirdekler nedeniyle küçük farklar beklenir; karşılaştırma `|a − b| < ε` olmalıdır. ε, sonuçlar görülmeden önce, kararın duyarlılığına göre seçilir (dakikada 1e-3 karar için anlamsızdır). Kırmızı test görüldükten sonra ε'u büyütmek testi anlamsızlaştırır. 2e-5'lik fark ONNX'in hatalı olduğunu göstermez.
- **c)** Karakterizasyon testi: mevcut davranışı belgeler, doğruluğu değil. Fark çıkınca otomatik "hata" denmez; fark incelenir, bilinçli bir değişiklikse beklenti güncellenip gerekçesi kaydedilir. Kabul edilen davranış sonra regresyon testi olur.
- **d)** Gölge dağıtım: yeni model çalışır ama kararı eski kural verir; tahminler gerçek varışlarla karşılaştırılır. Sonra küçük bir canary (örneğin bir ilçe veya %5), ardından kademeli açılım. Tetikleyiciler: hata oranı veya gecikmede artış, çalışma zamanları arası fark, eski kurala göre kötüleşen MAE. Geri dönüş: yapılandırmayla eski kurala veya önceki sabit (commit'e bağlı) model sürümüne dönmek.
- **e)** Model, örneğin hangi hastanın ambulans alacağına tek başına karar vermek için kullanılmamalıdır. Sınırlılık örnekleri: yalnızca kuru hava aylarından veri, yeni açılan yollar, nadir olaylar (kar, kaza). Bunlar dağılım kaymasına yol açar.

## Sık çeldiriciler

"Testler geçtiyse sistem doğrudur"; "iki çıktı bit düzeyinde aynı değilse model bozuktur"; "toleransı test geçene kadar büyütürüz"; "eski sistemin çıktısı doğru cevaptır"; "canary, küçük bir test ortamıdır" (oysa gerçek kullanıcıyla yapılır); "geri dönüş yeniden eğitimdir".

## Ezber neden yetmez

Tanımları bilmek yetmez. Öğrenci üç kişinin somut ve kısmen haklı cümlelerinde hangi kavramın yanlış uygulandığını bulmalı, sayısal bir farkın anlamını yorumlamalı ve kendi planını gerekçelendirmelidir. Doğru cevap tek bir terim değil, bir akıl yürütmedir.

## Puanlama (her bölüm 8 puan)

| Puan | Ölçüt |
|---|---|
| 8 | Kavramı doğru adlandırır, senaryodaki cümleye uygular, somut bir ölçüm veya adım önerir |
| 5 | Kavramı doğru adlandırır ve uygular, öneri genel kalır |
| 2 | Yalnızca tanım verir, senaryoya bağlamaz |
| 0 | Çeldiriciyi kabul eder veya boş |

b) bölümünde "ε'u sonuçları görmeden seçmek" ve c) bölümünde "eski çıktı doğruluk değildir" ifadelerinin her biri, tam puan için zorunludur.
