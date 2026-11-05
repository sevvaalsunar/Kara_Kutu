# data/gercek/ — gerçek katılımcı oturumları

Buraya yalnızca **gerçek katılımcıların** oyunun son ekranından indirdiği `kara-kutu-oturum-<12 karakter>.csv` dosyaları konur. Dosya adlarını değiştirme.

```bash
python data/birlestir.py                      # katı: tek hatalı dosya varsa hiçbir şey birleştirilmez
python data/birlestir.py --gecersizleri-atla  # hatalıları reddedilen/ altına gerekçesiyle taşır, kalanları birleştirir
python train.py                               # 15 gerçek oturum yoksa açıkça uyarır ve modeli kabul etmez
```

Reddedilen dosyalar:

- `kara-kutu-TEST-oturum-…` (`kaynak=test`) doğrulama oturumlarıdır.
- Şemaya uymayan dosyalar reddedilir.
- Başka bir dosyayla aynı olan ya da başka dosyadaki oturumu tekrar eden dosyalar reddedilir.

Durum özeti: `data/VERI_RAPORU.md`. Şablon ve açıklamalı örnek: `data/sablon/`.

**Şu an bu klasörde gerçek oturum yok (0/15).**
