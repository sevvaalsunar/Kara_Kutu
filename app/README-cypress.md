# Cypress E2E testleri

Testler uygulamayı `?test=1` modunda açar; bu modda tutor Gemini API'yi çağırmaz, sabit bir cevap döner. Bu yüzden API anahtarı gerekmez ve her koşu aynı sonucu verir.

## Kurulum (bir kez)

```
cd app
npm install
```

Cypress `devDependencies` içinde olduğu için `npm install` onu da kurar.

## Çalıştırma

İki terminal aç:

```
# Terminal 1: uygulamayı başlat (http://localhost:3000)
cd app
npm run dev

# Terminal 2: testleri koş
cd app
npx cypress run
```

Testleri tarayıcıda adım adım izlemek için `npx cypress open`.

## Dosyalar

| Dosya | Ne test ediyor |
|---|---|
| `cypress/e2e/yollar.cy.js` | 8 yolun hepsi: doğru son, doğru neden metni, doğru saat; "Baştan oyna" |
| `cypress/e2e/kabul.cy.js` | spec.md §8'deki 5 kabul örneği, giriş ve kişiselleştirme kuralları, oyun içi saat |
| `cypress/e2e/00-demo.cy.js` | Yaklaşık 60 saniyelik yavaş oynanış (demo videosu için) |
| `cypress/e2e/adaptif.cy.js` | v2.0 KÖ6–KÖ7: zorlanan oyuncuya kavram özeti ve ek destek, akıcı oyuncuya standart akış, 90 sn sayaç, destek metinlerinin cevap vermemesi |
| `cypress/e2e/model.cy.js` | v2.0 KÖ8: model yükleme, gölge mod, model indirilemezse oyunun bozulmaması, `?model=off`, aralık dışı girdinin reddi |
| `cypress/e2e/parite.cy.js` | v2.0 KÖ9: `tests/parite.json`'daki 5 referans girdide tarayıcı ↔ Python farkı < 1e-4 |
| `cypress/e2e/veri.cy.js` | v2.0 veri toplama modu: onay, gölge mod, CSV dışa aktarma |
| `cypress/e2e/01-adaptif-demo.cy.js` | v2.0 demo: aynı sahnede iki oyuncu, iki farklı deneyim |

v2.0 testleri model yüklenmesini debug panelinden (`?debug=1`) bekler. `npm run dev` model dosyalarını `public/model/` altına otomatik kopyalar (`scripts/sync-model.mjs`).

## Demo videosu

```
npx cypress run --spec cypress/e2e/00-demo.cy.js
```

Video `cypress/videos/00-demo.cy.js.mp4` olarak kaydedilir.
