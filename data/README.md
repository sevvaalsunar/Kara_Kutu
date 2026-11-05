# data/ — veri toplama ve hazırlama

| Dosya | İçerik |
|---|---|
| `oturumlar.csv` | Eğitim verisi: `sentetik.csv` + `gercek/*.csv` (birleştirici üretir) |
| `SOZLUK.md` | Sütun sözlüğü |
| `schema.py` | Şema, sabitler ve özellik/etiket formüllerinin referans uygulaması |
| `validate_dataset.py` | CSV doğrulayıcı (şema, aralık, tutarlılık, etiket kuralı, kişisel veri sütunu) |
| `generate_synthetic.py` | Deterministik sentetik üretici |
| `birlestir.py` | Sentetik ve gerçek CSV'leri doğrulayıp birleştirir; tekrar eden dosya/oturumu ve `kaynak=test` dosyalarını reddeder, tamamlanmamış oturumları uyarır |
| `VERI_RAPORU.md` | Birleştiricinin ürettiği veri raporu (gerçek/sentetik sayıları, uyarılar, özellik ortalamaları) |
| `tavan_analizi.py` / `.json` | Bayes-optimal tavan analizi (RELEASE.md) |
| `gercek/` | Oyuncuların indirdiği gerçek oturum CSV'leri |

## Mevcut durum

400 sentetik oturum (2010 satır, 1610 etiketli), **0 gerçek oturum**. Ödevin istediği 15 gerçek oturum henüz toplanmadı.

## Gerçek oturum toplama

Katılımcılara gönderilecek metin: [`docs/KATILIMCI.md`](../docs/KATILIMCI.md).

1. Uygulamayı `?veri=1` ile aç (ör. `https://sevvaalsunar.github.io/Kara_Kutu/?veri=1`). Bu modda model **gölgede** çalışır: olasılık kaydedilir, oyun değişmez. Böylece etiketler müdahaleden etkilenmez.
2. Katılımcı gizlilik notunu okuyup onay kutusunu işaretler ve oynar. İsterse "Baştan oyna" ile tekrar oynar; aynı oturumda kalır.
3. Son ekranda **"Oturum verisini indir (CSV)"** ile dosyayı kendisi indirir ve sana gönderir. Veri hiçbir sunucuya gitmez.
4. Dosyaları `data/gercek/` altına koy, sonra:

```bash
python data/birlestir.py
python data/validate_dataset.py data/oturumlar.csv
```

Birleştirici `gercek/` klasöründe `kaynak=gercek` olmayan (ör. `kaynak=test`), şemaya uymayan, başka bir dosyayla aynı olan ya da başka dosyadaki oturumu tekrar eden dosyaları reddeder ve hiçbir şey yazmaz. Tamamlanmamış oturumları (son kararı K3 değil) `VERI_RAPORU.md`'de uyarı olarak listeler.

Hat, gerçek tarayıcıda 3 test katılımcısıyla uçtan uca doğrulandı (`tools/browser-e2e`, `veriHatti`): CSV'ler tarayıcıdan indirildi, doğrulayıcıdan geçti ve `kaynak=test` oldukları için birleştirici tarafından reddedildi. Bu oturumlar gerçek oturum sayılmaz. Bir oturumu yalnızca bir kez ekle; aynı kişinin farklı günlerde oynaması ayrı oturumdur ama grup bölmesi bunu bilemez.

## Sentetik veri

```bash
python data/generate_synthetic.py --oturum 400 --tohum 20261104
```

Üretim kuralları `generate_synthetic.py` dosyasının başındadır. Özet: her oturuma gizli bir zorlanma değeri `s ~ Beta(2,2)` atanır. Riskli seçim olasılığı, süre, tereddüt ve ipucu kullanımı `s`'ye bağlıdır; aynı sahneyi tekrar görmek riski azaltır. Özellikler ve etiketler `schema.py`'deki referans fonksiyonlarla hesaplanır, yani tarayıcıyla aynı formüller kullanılır.

**Sınırlılık:** Sentetik veri yalnızca üreticinin varsayımlarını içerir. Gerçek oyuncu davranışının yerine geçmez ve sentetik veriyle ölçülen metrikler gerçek başarıyı göstermez.
