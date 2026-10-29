# KARA KUTU: Otonom Yaşam Destek Krizi

YZM301 · SE Primer ödevi · Şevval Sunar

Saat 03:14. Yapay zekâ destekli yoğun bakım ağı ICU-Net siber saldırı altında ve 300 hastanın cihazına yanlış komutlar gidiyor. Nöbetçi mühendis sensin. Oyuncu üç mühendislik kararı verir (mimari, veri ve test, güvenlik ve KVKK). Her karardan sonra uygulama kararın teknik sonucunu ve nedenini gösterir. Takılan oyuncuya bir AI tutor cevabı söylemeden, soru sorarak yol gösterir.

## Linkler

- **GitHub deposu:** [sevvaalsunar/Kara_Kutu](https://github.com/sevvaalsunar/Kara_Kutu)
- **Herkese açık canlı uygulama (GitHub Pages):** [KARA KUTU](https://sevvaalsunar.github.io/Kara_Kutu/)
- **AI Studio sürümü:** [KARA KUTU — AI Studio](https://ai.studio/apps/0d3c42eb-7942-4398-a0f7-80546707e3c9) (Google oturumu gerektirebilir)
- **Demo videosu (14 sn):** [app/cypress/videos/00-demo.cy.js.mp4](app/cypress/videos/00-demo.cy.js.mp4)

## Repo yapısı

| Yol | İçerik | Ödevdeki karşılığı |
|---|---|---|
| `spec.md` | Problem, kapsam, kapsam dışı, senaryo, 5 kabul örneği, durum makinesi | spec.md (20) |
| `design/`, `DESIGN.md` | 5 Stitch ekranı ve tasarım sistemi | Tasarım (15) |
| `app/` | Google AI Studio ile üretilen uygulama | Çalışan uygulama (20) |
| `eval/` | 20 öğrenci mesajı, etiketler, rapor (ele verme: tur 1 7/20, tur 2 4/20) | Tutor eval (25) |
| `app/cypress/` | Tüm yolların E2E testleri ve demo (`app/README-cypress.md`) | Cypress demo (10) |
| `README.md` | Bu belge ve ürün kararı | Ürün kararı (10) |

## Ürün kararı: yapmadığım 3 özellik

1. **Kararı geri alma:** Kriz anında verilen kararların geri alınamaması oyunun öğretmek istediği şeyin kendisi; geri alma butonu bu dersi boşaltırdı, yolları denemek için "Baştan oyna" var.
2. **Gerçek zamanlı akan oyun saati:** Saat gerçek zamanla aksaydı oyuncu metni okurken cezalandırılırdı ve hikâyedeki zaman çizelgesi tutmazdı; süre baskısını yalnızca isteyen oyuncuya, "Deneyimliyim" modundaki 60 saniyelik sayaçla verdim.
3. **Hesap ve ilerleme kaydı:** Beş dakikalık tek oturumluk bir oyunda kayıt yalnızca sürtünme eklerdi ve kişisel veri saklamak KVKK yükümlülüğü getirirdi.

## Çalıştırma

```
cd app
npm install
npm run dev
```

Tutor için `app/.env` dosyasına bir Gemini API anahtarı eklenir (ayrıntılar `app/README.md`'de). Anahtar yoksa tutor her karar için başlangıç ipucunu gösterir; oyun yine oynanır. Testler için `app/README-cypress.md`'ye bakın.

## Araçlar

Google Stitch (tasarım) → Google AI Studio (uygulama) → Cypress (E2E test). Uygulama kodu AI Studio tarafından üretildi; spec, tasarım kararları, eval ve ürün kararı bana ait.
