# SINAV_TASARIMI — Kapalı kitap klasik soru (40 puan, 35 dk)

**Senaryo.** Belediye, ambulans varış süresini tahmin eden bir modeli Python'da eğitip ONNX'e aktarıyor; model hem tablet tarayıcısında hem Python servisinde çalışıyor. Eskiden "yoğun saatte süreyi 1,4 ile çarp" kuralı vardı.
- **Ece:** "100 güzergâhı `==` ile karşılaştırdım; 3'ünde 0,00002 dk fark var, test kırmızı. ONNX hatalı."
- **Mert:** "Testler yeşil, model doğru; bugün tüm ambulanslara açalım."
- **Zeynep:** "Eski kuralın çıktılarını test beklentisi yapalım."

**Soru (her bölüm 8 puan).**
a) Mert'in hatasını doğrulama/geçerleme ayrımıyla açıklayın; geçerleme için bir ölçüm önerin.
b) Ece'nin testi diferansiyel test midir? Oracle nedir? `==` yerine ne kullanırsınız, toleransı ne zaman seçersiniz?
c) Zeynep'in önerisi hangi test türüdür? Yeni model eskisinden farklı sonuç verirse ne yapılır?
d) Bir dağıtım planı ve iki geri dönüş tetikleyicisi yazın.
e) Model hangi kararda kullanılmamalıdır? Veriden kaynaklanan bir sınırlılık verin.

**Beklenen cevaplar.**
a) Testler şartnameye uyumu (doğrulama) gösterir, gerçek dünyada işe yaramayı (geçerleme) değil; görülmemiş gerçek varışlarda hata (ör. MAE) ve eski kurala göre iyileşme ölçülmeli.
b) Evet; oracle Python çıktısıdır ve doğruluğu değil tutarlılığı gösterir. float32 farkları beklenir: `|a−b| < ε`, ε sonuç görülmeden ve kararın duyarlılığına göre seçilir. 2e-5 fark hata değildir.
c) Karakterizasyon testi; eski davranışı belgeler, doğruluğu değil. Fark incelenir; bilinçliyse beklenti gerekçesiyle güncellenir ve regresyon testi olur.
d) Gölge (karar eski kuralda) → küçük canary → kademeli açılım. Tetikleyiciler: MAE'nin kötüleşmesi, gecikme/hata artışı, çalışma zamanları arası fark. Geri dönüş: yapılandırmayla eski kurala veya önceki sabit sürüme.
e) Hastaya ambulans verilip verilmeyeceğine tek başına karar vermek. Sınırlılık: yalnızca kuru hava verisi, yeni yollar, nadir olaylar (dağılım kayması).

**Sık çeldiriciler.** "Testler geçti, sistem doğru" · "bit düzeyinde aynı değilse model bozuk" · "toleransı test geçene kadar büyütürüz" · "eski çıktı doğru cevaptır" · "geri dönüş yeniden eğitimdir".

**Ezber neden yetmez.** Öğrenci tanım vermekle kalmaz; üç kısmen haklı cümlede yanlış uygulanan kavramı bulur, sayısal bir farkı yorumlar ve kendi planını gerekçelendirir.

**Puanlama (bölüm başına).** 8: kavram doğru, senaryoya uygulanmış, somut ölçüm/adım var · 5: doğru ve uygulanmış, öneri genel · 2: yalnızca tanım · 0: çeldiriciyi kabul eder. Tam puan için zorunlu: (b)'de "ε sonuçları görmeden seçilir", (c)'de "eski çıktı doğruluk değildir".
